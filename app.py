from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, auth
import google.generativeai as genai
import os
from datetime import datetime, timedelta
import hashlib
import secrets
from functools import wraps
import jwt
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
CORS(app)

def initialize_firebase():
    if os.environ.get('FIREBASE_CREDENTIALS'):
        # For production (Render) - use env variable with full JSON key
        service_account_info = json.loads(os.environ['FIREBASE_CREDENTIALS'])
        cred = credentials.Certificate(service_account_info)
    else:
        # For local development - use the local JSON file
        cred = credentials.Certificate(
            '')

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    return db

# Initialize Firebase
db = initialize_firebase()

genai.configure(api_key=os.environ.get('GEMINI_API_KEY', 'AIzaSyAWCRKSWg0i3TwvINiJBlOmQ910QVZlDYc'))

# Create the model
generation_config = {
    "temperature": 0.3,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 1000,
    "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)


# Authentication decorator with Firebase Auth verification
def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        try:
            # Extract token from "Bearer <token>" format
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else auth_header
            
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            request.current_user = decoded_token
            
            return f(*args, **kwargs)
            
        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid authentication token'}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'Authentication token expired'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function

# Legacy session-based auth decorator (for backward compatibility)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# Enhanced Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate input data
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not all([name, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Validate email format
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists in Firestore (additional check)
        existing_user_query = db.collection('users').where('email', '==', email).limit(1).get()
        if existing_user_query:
            return jsonify({'error': 'Email address is already in use'}), 400
        
        # Create user in Firebase Auth first
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=name,
                email_verified=False
            )
            print(f"Firebase Auth user created: {user.uid}")
        except auth.EmailAlreadyExistsError:
            return jsonify({'error': 'Email address is already in use'}), 400
        except auth.WeakPasswordError as e:
            return jsonify({'error': f'Password is too weak: {str(e)}'}), 400
        except Exception as e:
            print(f"Firebase Auth error: {str(e)}")
            return jsonify({'error': f'Failed to create user account: {str(e)}'}), 500
        
        # Create user document in Firestore
        try:
            user_data = {
                'uid': user.uid,
                'name': name,
                'email': email,
                'created_at': datetime.now(),
                'last_login': None,
                'profile': {
                    'avatar_url': None,
                    'bio': None,
                    'preferred_language': 'en',
                    'notification_preferences': {
                        'email_notifications': True,
                        'push_notifications': True
                    }
                },
                'stats': {
                    'terms_learned': 0,
                    'quizzes_completed': 0,
                    'challenges_solved': 0,
                    'total_score': 0,
                    'streak_days': 0,
                    'last_activity': None
                },
                'achievements': [],
                'preferences': {
                    'difficulty_level': 'beginner',
                    'favorite_topics': []
                }
            }
            
            # Use the user's UID as the document ID
            db.collection('users').document(user.uid).set(user_data)
            print(f"Firestore user document created: {user.uid}")
            
        except Exception as e:
            print(f"Firestore error: {str(e)}")
            # If Firestore fails, we should delete the Firebase Auth user to maintain consistency
            try:
                auth.delete_user(user.uid)
                print(f"Cleaned up Firebase Auth user: {user.uid}")
            except Exception as cleanup_error:
                print(f"Failed to cleanup Firebase Auth user: {str(cleanup_error)}")
            
            return jsonify({'error': f'Failed to create user profile: {str(e)}'}), 500
        
        # If we reach here, everything succeeded
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user.uid,
            'email': user.email,
            'name': name
        }), 201
        
    except Exception as e:
        print(f"Unexpected registration error: {str(e)}")
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    

@app.route('/api/login', methods=['POST'])
def login():
    """
    Login endpoint for session-based authentication
    Note: For Firebase Auth, login is typically handled on the client side
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # For Firebase Auth, you typically don't verify passwords on the server
        # Instead, the client handles authentication and sends ID tokens
        # But for compatibility, we can check if user exists
        
        try:
            # Get user by email from Firebase Auth
            user = auth.get_user_by_email(email)
            
            # Get user data from Firestore
            user_ref = db.collection('users').document(user.uid)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'error': 'User profile not found'}), 404
            
            user_data = user_doc.to_dict()
            
            # Update last login
            user_ref.update({
                'last_login': datetime.now()
            })
            
            # Create session (for session-based auth)
            session['user_id'] = user.uid
            session['user_email'] = user.email
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'uid': user.uid,
                    'name': user_data.get('name'),
                    'email': user.email,
                    'email_verified': user.email_verified,
                    'stats': user_data.get('stats', {}),
                    'profile': user_data.get('profile', {})
                }
            }), 200
            
        except auth.UserNotFoundError:
            return jsonify({'error': 'Invalid email or password'}), 401
        except Exception as e:
            print(f"Login error: {str(e)}")
            return jsonify({'error': 'Login failed'}), 401
            
    except Exception as e:
        print(f"Unexpected login error: {str(e)}")
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/verify-token', methods=['POST'])
def verify_token():
    """Verify Firebase ID token and return user info"""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'ID token is required'}), 400
        
        # Verify the ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get user data from Firestore
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            
            # Update last login
            user_ref.update({
                'last_login': datetime.now()
            })
            
            return jsonify({
                'message': 'Token verified successfully',
                'user': {
                    'uid': uid,
                    'name': user_data.get('name'),
                    'email': user_data.get('email'),
                    'email_verified': decoded_token.get('email_verified', False),
                    'stats': user_data.get('stats', {}),
                    'profile': user_data.get('profile', {})
                }
            }), 200
        else:
            return jsonify({'error': 'User profile not found'}), 404
            
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid ID token'}), 401
    except auth.ExpiredIdTokenError:
        return jsonify({'error': 'ID token expired'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/refresh-token', methods=['POST'])
def refresh_token():
    """Handle token refresh"""
    try:
        data = request.get_json()
        refresh_token = data.get('refreshToken')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token is required'}), 400
        
        # Note: Firebase Admin SDK doesn't directly handle refresh tokens
        # This would typically be handled on the client side
        return jsonify({
            'message': 'Token refresh should be handled on client side',
            'instructions': 'Use Firebase Client SDK to refresh tokens'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/send-verification-email', methods=['POST'])
@firebase_auth_required
def send_verification_email():
    """Send email verification"""
    try:
        uid = request.current_user['uid']
        
        # Generate email verification link
        link = auth.generate_email_verification_link(
            request.current_user['email'],
            action_code_settings=None
        )
        
        # Here you would typically send the email using your email service
        # For now, we'll just return the link
        return jsonify({
            'message': 'Verification email sent',
            'verification_link': link  # Remove this in production
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/send-password-reset', methods=['POST'])
def send_password_reset():
    """Send password reset email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Generate password reset link
        link = auth.generate_password_reset_link(email)
        
        # Here you would typically send the email using your email service
        return jsonify({
            'message': 'Password reset email sent',
            'reset_link': link  # Remove this in production
        }), 200
        
    except auth.UserNotFoundError:
        # Don't reveal if user exists or not for security
        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-profile', methods=['PUT'])
@firebase_auth_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        uid = request.current_user['uid']
        
        allowed_fields = ['name', 'bio', 'avatar_url', 'preferred_language', 'difficulty_level', 'favorite_topics']
        update_data = {}
        
        # Validate and prepare update data
        if 'name' in data:
            display_name = data['name'].strip()
            if display_name:
                # Update in Firebase Auth
                auth.update_user(uid, display_name=display_name)
                update_data['name'] = display_name
        
        if 'bio' in data:
            update_data['profile.bio'] = data['bio']
        
        if 'avatar_url' in data:
            update_data['profile.avatar_url'] = data['avatar_url']
        
        if 'preferred_language' in data:
            update_data['profile.preferred_language'] = data['preferred_language']
        
        if 'difficulty_level' in data:
            update_data['preferences.difficulty_level'] = data['difficulty_level']
        
        if 'favorite_topics' in data:
            update_data['preferences.favorite_topics'] = data['favorite_topics']
        
        # Update notification preferences
        if 'notification_preferences' in data:
            prefs = data['notification_preferences']
            if 'email_notifications' in prefs:
                update_data['profile.notification_preferences.email_notifications'] = prefs['email_notifications']
            if 'push_notifications' in prefs:
                update_data['profile.notification_preferences.push_notifications'] = prefs['push_notifications']
        
        # Update Firestore document
        if update_data:
            user_ref = db.collection('users').document(uid)
            user_ref.update(update_data)
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-account', methods=['DELETE'])
@firebase_auth_required
def delete_account():
    """Delete user account"""
    try:
        uid = request.current_user['uid']
        
        # Delete user data from Firestore
        user_ref = db.collection('users').document(uid)
        user_ref.delete()
        
        # Delete related data (quizzes, submissions, etc.)
        # Quiz sessions
        quiz_sessions = db.collection('quiz_sessions').where('user_id', '==', uid)
        for doc in quiz_sessions.stream():
            doc.reference.delete()
        
        # Code submissions
        submissions = db.collection('code_submissions').where('user_id', '==', uid)
        for doc in submissions.stream():
            doc.reference.delete()
        
        # Delete from Firebase Auth (this should be done last)
        auth.delete_user(uid)
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dictionary Routes with Gemini AI
@app.route('/api/dictionary/search', methods=['GET'])
def search_dictionary():
    try:
        term = request.args.get('term', '').strip()
        category = request.args.get('category', 'all')
        
        if not term:
            return jsonify({'error': 'Search term is required'}), 400
        
        # Check if term already exists in database first
        existing_definition = get_existing_term(term, category)
        
        if existing_definition:
            # Return cached definition from database
            return jsonify({'results': [existing_definition]}), 200
        else:
            # Ask AI for definition since term not found in database
            ai_definition = get_gemini_definition(term, category)
            
            if ai_definition:
                # Save the AI-generated definition to database for future use
                save_term_to_db(ai_definition)
                return jsonify({'results': [ai_definition]}), 200
            else:
                return jsonify({'error': 'Could not generate definition for this term'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_existing_term(term, category):
    """Check if term already exists in database"""
    try:
        terms_ref = db.collection('dictionary_terms')
        
        # Search for exact term match (case-insensitive)
        if category != 'all':
            query = terms_ref.where(filter=firestore.FieldFilter('category', '==', category)).where(filter=firestore.FieldFilter('term', '==', term.lower()))
        else:
            query = terms_ref.where(filter=firestore.FieldFilter('term', '==', term.lower()))
        
        docs = list(query.limit(1).stream())
        
        if docs:
            data = docs[0].to_dict()
            return {
                'term': data['term'],
                'definition': data['definition'],
                'category': data['category'],
                'examples': data.get('examples', []),
                'related_terms': data.get('related_terms', []),
                'source': data.get('source', 'database')
            }
        return None
        
    except Exception as e:
        print(f"Error checking existing term: {e}")
        return None

def get_gemini_definition(term, category='general'):
    """Ask Gemini AI to generate definition for the term"""
    try:
        print(f"Asking AI for definition of: {term}")
        
        # More flexible prompt that handles various term types
        prompt = f"""What is the definition of this term?

The term is: {term}

Please provide a comprehensive definition in JSON format with the following structure:
{{
    "term": "{term.lower()}",
    "definition": "A clear, concise definition of the term",
    "category": "Choose from: programming, networking, cybersecurity, algorithms, databases, hardware, business, finance, or general",
    "examples": [
        "Practical example 1",
        "Practical example 2",
        "Practical example 3"
    ],
    "related_terms": [
        "Related term 1",
        "Related term 2", 
        "Related term 3"
    ]
}}

Guidelines:
- If this is an IT/Computer Science term, provide a technical definition
- If this is a business/finance term (like UBS), provide appropriate business context
- If it's an acronym, explain what it stands for and its meaning
- Keep the definition clear and educational
- Use practical, real-world examples relevant to the term's domain
- Choose the most appropriate category from the list
- Provide genuinely related terms that would help learning
- Ensure accuracy for the specific domain context

Return only valid JSON without any additional text, code blocks, or formatting."""
        
        response = model.generate_content(prompt)
        
        # More robust response cleaning
        response_text = response.text.strip()
        
        # Remove various markdown formatting possibilities
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Additional cleaning for common AI response patterns
        lines = response_text.split('\n')
        json_lines = []
        in_json = False
        
        for line in lines:
            line = line.strip()
            if line.startswith('{') or in_json:
                in_json = True
                json_lines.append(line)
                if line.endswith('}') and line.count('}') >= line.count('{'):
                    break
        
        if json_lines:
            response_text = '\n'.join(json_lines)
        
        print(f"Cleaned response: {response_text[:200]}...")  # Debug print
        
        # Parse the JSON response
        ai_response = json.loads(response_text)
        
        # Validate the response structure
        required_fields = ['term', 'definition', 'category', 'examples', 'related_terms']
        missing_fields = [field for field in required_fields if field not in ai_response]
        
        if missing_fields:
            print(f"Gemini response missing required fields: {missing_fields}")
            # Try to fill in missing fields with defaults
            if 'term' not in ai_response:
                ai_response['term'] = term.lower()
            if 'definition' not in ai_response:
                print("Critical error: No definition provided")
                return None
            if 'category' not in ai_response:
                ai_response['category'] = category
            if 'examples' not in ai_response:
                ai_response['examples'] = []
            if 'related_terms' not in ai_response:
                ai_response['related_terms'] = []
        
        ai_response['source'] = 'ai_generated'
        print(f"AI successfully generated definition for: {term}")
        return ai_response
        
    except json.JSONDecodeError as e:
        print(f"Gemini JSON decode error: {e}")
        print(f"Raw response text: {response.text if 'response' in locals() else 'No response'}")
        print(f"Cleaned response text: {response_text if 'response_text' in locals() else 'No cleaned text'}")
        
        # Fallback: try to extract definition manually if JSON parsing fails
        try:
            if 'response' in locals() and hasattr(response, 'text'):
                raw_text = response.text
                # Simple fallback definition extraction
                return {
                    'term': term.lower(),
                    'definition': f"AI provided definition (parsing failed): {raw_text[:200]}...",
                    'category': category,
                    'examples': [],
                    'related_terms': [],
                    'source': 'ai_generated_fallback'
                }
        except:
            pass
        
        return None
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None

def save_term_to_db(term_data):
    """Save the AI-generated term definition to database"""
    try:
        db.collection('dictionary_terms').add({
            **term_data,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        })
        print(f"Saved term '{term_data['term']}' to database")
    except Exception as e:
        print(f"Error saving term to database: {e}")

# Optional: Route to get all categories
@app.route('/api/dictionary/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    categories = [
        'programming',
        'networking', 
        'cybersecurity',
        'algorithms',
        'databases',
        'hardware',
        'general'
    ]
    return jsonify({'categories': categories}), 200

# Quiz Routes with Firebase Auth
@app.route('/api/quiz/categories', methods=['GET'])
def get_quiz_categories():
    try:
        categories_ref = db.collection('quiz_categories')
        categories = []
        
        for doc in categories_ref.stream():
            data = doc.to_dict()
            categories.append({
                'id': doc.id,
                'name': data['name'],
                'description': data['description'],
                'difficulty': data['difficulty'],
                'question_count': data.get('question_count', 0)
            })
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/start', methods=['POST'])
@firebase_auth_required
def start_quiz():
    try:
        data = request.get_json()
        category = data.get('category')
        
        if not category:
            return jsonify({'error': 'Category is required'}), 400
        
        uid = request.current_user['uid']
        
        # Get questions from database
        questions_ref = db.collection('quiz_questions').where('category', '==', category)
        questions = list(questions_ref.limit(10).stream())
        
        if not questions:
            return jsonify({'error': 'No questions found for this category'}), 404
        
        quiz_data = []
        for doc in questions:
            q_data = doc.to_dict()
            quiz_data.append({
                'id': doc.id,
                'question': q_data['question'],
                'options': q_data['options'],
                'correct_answer': q_data['correct_answer'],
                'explanation': q_data.get('explanation', '')
            })
        
        # Create quiz session
        quiz_session = {
            'user_id': uid,
            'category': category,
            'questions': quiz_data,
            'start_time': datetime.now(),
            'status': 'active'
        }
        
        quiz_ref = db.collection('quiz_sessions').add(quiz_session)
        
        # Remove correct answers from response
        for q in quiz_data:
            del q['correct_answer']
        
        return jsonify({
            'quiz_id': quiz_ref[1].id,
            'questions': quiz_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/submit', methods=['POST'])
@firebase_auth_required
def submit_quiz():
    try:
        data = request.get_json()
        quiz_id = data.get('quiz_id')
        answers = data.get('answers')  # {question_id: selected_option}
        
        if not all([quiz_id, answers]):
            return jsonify({'error': 'Quiz ID and answers are required'}), 400
        
        uid = request.current_user['uid']
        
        # Get quiz session
        quiz_ref = db.collection('quiz_sessions').document(quiz_id)
        quiz_doc = quiz_ref.get()
        
        if not quiz_doc.exists:
            return jsonify({'error': 'Quiz not found'}), 404
        
        quiz_data = quiz_doc.to_dict()
        
        # Verify quiz belongs to current user
        if quiz_data.get('user_id') != uid:
            return jsonify({'error': 'Unauthorized access to quiz'}), 403
        
        # Calculate score
        correct_answers = 0
        total_questions = len(quiz_data['questions'])
        results = []
        
        for question in quiz_data['questions']:
            q_id = question['id']
            user_answer = answers.get(q_id)
            correct = question['correct_answer']
            is_correct = user_answer == correct
            
            if is_correct:
                correct_answers += 1
            
            results.append({
                'question_id': q_id,
                'question': question['question'],
                'user_answer': user_answer,
                'correct_answer': correct,
                'is_correct': is_correct,
                'explanation': question.get('explanation', '')
            })
        
        score = (correct_answers / total_questions) * 100
        
        # Update quiz session
        quiz_ref.update({
            'answers': answers,
            'score': score,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'completed_at': datetime.now(),
            'status': 'completed'
        })
        
        # Update user stats
        user_ref = db.collection('users').document(uid)
        user_ref.update({
            'stats.quizzes_completed': firestore.Increment(1),
            'stats.total_score': firestore.Increment(int(score)),
            'stats.last_activity': datetime.now()
        })
        
        return jsonify({
            'score': score,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Firebase authentication decorator
def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
            
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            decoded_token = firebase_auth.verify_id_token(token)
            request.current_user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

# Sample challenges data (can be moved to Firebase)
CHALLENGES = {
    'array_reverse': {
        'title': 'Array Reverse',
        'difficulty': 'easy',
        'description': 'Complete the function to reverse an array without using built-in reverse methods.',
        'example': 'Input: [1, 2, 3, 4, 5]\nOutput: [5, 4, 3, 2, 1]',
        'solved_count': 234,
        'rating': 4.5,
        'category': 'Arrays',
        'test_cases': [
            {'input': [1, 2, 3, 4, 5], 'expected': [5, 4, 3, 2, 1]},
            {'input': [1], 'expected': [1]},
            {'input': [], 'expected': []},
            {'input': [1, 2], 'expected': [2, 1]}
        ],
        'starter_code': {
            'python': 'def reverse_array(arr):\n    # Your code here\n    pass\n\n# Test your function\nprint(reverse_array([1, 2, 3, 4, 5]))',
            'javascript': 'function reverseArray(arr) {\n    // Your code here\n    return arr;\n}\n\n// Test your function\nconsole.log(reverseArray([1, 2, 3, 4, 5]));'
        }
    },
    'palindrome_check': {
        'title': 'Palindrome Checker',
        'difficulty': 'easy',
        'description': 'Implement a function to check if a string is a valid palindrome (ignoring spaces and case).',
        'example': 'Input: \'A man a plan a canal Panama\'\nOutput: True',
        'solved_count': 189,
        'rating': 4.3,
        'category': 'Strings',
        'test_cases': [
            {'input': 'racecar', 'expected': True},
            {'input': 'A man a plan a canal Panama', 'expected': True},
            {'input': 'race a car', 'expected': False},
            {'input': '', 'expected': True}
        ],
        'starter_code': {
            'python': 'def is_palindrome(s):\n    # Your code here\n    pass\n\n# Test your function\nprint(is_palindrome(\'racecar\'))',
            'javascript': 'function isPalindrome(s) {\n    // Your code here\n    return false;\n}\n\n// Test your function\nconsole.log(isPalindrome(\'racecar\'));'
        }
    },
    'two_sum': {
        'title': 'Two Sum Problem',
        'difficulty': 'medium',
        'description': 'Given an array of integers and a target sum, return the indices of two numbers that add up to the target.',
        'example': 'Input: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]',
        'solved_count': 156,
        'rating': 4.6,
        'category': 'Arrays',
        'test_cases': [
            {'input': {'nums': [2, 7, 11, 15], 'target': 9}, 'expected': [0, 1]},
            {'input': {'nums': [3, 2, 4], 'target': 6}, 'expected': [1, 2]},
            {'input': {'nums': [3, 3], 'target': 6}, 'expected': [0, 1]}
        ],
        'starter_code': {
            'python': 'def two_sum(nums, target):\n    # Your code here\n    pass\n\n# Test your function\nprint(two_sum([2, 7, 11, 15], 9))',
            'javascript': 'function twoSum(nums, target) {\n    // Your code here\n    return [];\n}\n\n// Test your function\nconsole.log(twoSum([2, 7, 11, 15], 9));'
        }
    }
}

# Routes
@app.route('/api/coding/challenges', methods=['GET'])
def get_coding_challenges():
    """Get all coding challenges"""
    try:
        # Try to get from Firebase first, fall back to local data
        try:
            challenges_ref = db.collection('coding_challenges')
            challenges = []
            
            for doc in challenges_ref.stream():
                data = doc.to_dict()
                challenges.append({
                    'id': doc.id,
                    'title': data['title'],
                    'description': data['description'],
                    'difficulty': data['difficulty'],
                    'solved_count': data.get('solved_count', 0),
                    'rating': data.get('rating', 0),
                    'category': data.get('category', 'general')
                })
            
            if challenges:
                return jsonify({'challenges': challenges}), 200
        except:
            pass
        
        # Fall back to local challenges
        challenges = []
        for challenge_id, challenge_data in CHALLENGES.items():
            challenges.append({
                'id': challenge_id,
                'title': challenge_data['title'],
                'description': challenge_data['description'],
                'difficulty': challenge_data['difficulty'],
                'solved_count': challenge_data.get('solved_count', 0),
                'rating': challenge_data.get('rating', 0),
                'category': challenge_data.get('category', 'general')
            })
        
        return jsonify({'challenges': challenges}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coding/challenge/<challenge_id>', methods=['GET'])
def get_challenge_details(challenge_id):
    """Get detailed challenge information"""
    try:
        # Try Firebase first
        try:
            challenge_ref = db.collection('coding_challenges').document(challenge_id)
            challenge_doc = challenge_ref.get()
            
            if challenge_doc.exists:
                data = challenge_doc.to_dict()
                return jsonify({
                    'id': challenge_id,
                    'title': data['title'],
                    'description': data['description'],
                    'difficulty': data['difficulty'],
                    'example': data.get('example', ''),
                    'starter_code': data.get('starter_code', {}),
                    'test_cases': data.get('test_cases', [])
                }), 200
        except:
            pass
        
        # Fall back to local data
        if challenge_id in CHALLENGES:
            challenge = CHALLENGES[challenge_id]
            return jsonify({
                'id': challenge_id,
                **challenge
            }), 200
        
        return jsonify({'error': 'Challenge not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coding/run', methods=['POST'])
def run_code():
    """Run code and return output"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code:
            return jsonify({'error': 'Code is required'}), 400
        
        # Execute code based on language
        if language == 'python':
            output = execute_python_code(code)
        elif language == 'javascript':
            output = execute_javascript_code(code)
        else:
            return jsonify({'error': f'Language {language} not supported'}), 400
        
        return jsonify({
            'success': True,
            'output': output
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 200

@app.route('/api/coding/submit', methods=['POST'])
def submit_code():
    """Submit code and run test cases"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        challenge_id = data.get('challenge_id', '')
        language = data.get('language', 'python')
        
        if not all([code, challenge_id]):
            return jsonify({'error': 'Code and challenge ID are required'}), 400
        
        # Get challenge data
        challenge = None
        try:
            challenge_ref = db.collection('coding_challenges').document(challenge_id)
            challenge_doc = challenge_ref.get()
            if challenge_doc.exists:
                challenge = challenge_doc.to_dict()
        except:
            pass
        
        if not challenge and challenge_id in CHALLENGES:
            challenge = CHALLENGES[challenge_id]
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        test_cases = challenge.get('test_cases', [])
        
        # Run test cases
        passed_tests = 0
        total_tests = len(test_cases)
        test_results = []
        
        for i, test_case in enumerate(test_cases):
            try:
                if language == 'python':
                    result = run_python_test_case(code, test_case, challenge_id)
                elif language == 'javascript':
                    result = run_javascript_test_case(code, test_case, challenge_id)
                else:
                    result = {'passed': False, 'error': 'Language not supported'}
                
                test_results.append({
                    'test_case': i + 1,
                    'input': test_case['input'],
                    'expected': test_case['expected'],
                    **result
                })
                
                if result.get('passed', False):
                    passed_tests += 1
                    
            except Exception as e:
                test_results.append({
                    'test_case': i + 1,
                    'passed': False,
                    'error': str(e)
                })
        
        success = passed_tests == total_tests
        
        # Save submission (optional, requires user authentication)
        try:
            submission_data = {
                'challenge_id': challenge_id,
                'code': code,
                'language': language,
                'passed_tests': passed_tests,
                'total_tests': total_tests,
                'success': success,
                'submitted_at': datetime.now(),
                'test_results': test_results
            }
            
            db.collection('code_submissions').add(submission_data)
        except:
            pass  # Continue even if saving fails
        
        return jsonify({
            'success': success,
            'passed_tests': passed_tests,
            'total_tests': total_tests,
            'test_results': test_results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Code execution functions
def execute_python_code(code):
    """Execute Python code safely"""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        # Execute with timeout
        result = subprocess.run(
            [sys.executable, temp_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Clean up
        os.unlink(temp_file)
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error: {result.stderr.strip()}"
            
    except subprocess.TimeoutExpired:
        return "Error: Code execution timed out"
    except Exception as e:
        return f"Error: {str(e)}"

def execute_javascript_code(code):
    """Execute JavaScript code safely"""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        # Execute with Node.js
        result = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Clean up
        os.unlink(temp_file)
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error: {result.stderr.strip()}"
            
    except subprocess.TimeoutExpired:
        return "Error: Code execution timed out"
    except FileNotFoundError:
        return "Error: Node.js not found. Please install Node.js to run JavaScript code."
    except Exception as e:
        return f"Error: {str(e)}"

def run_python_test_case(code, test_case, challenge_id):
    """Run a specific test case for Python code"""
    try:
        # Create test code that includes the user's function and test input
        test_input = test_case['input']
        expected = test_case['expected']
        
        # Modify code to test specific function based on challenge
        if challenge_id == 'array_reverse':
            test_code = f"""
{code}

# Test case
result = reverse_array({test_input})
print(result)
"""
        elif challenge_id == 'palindrome_check':
            test_code = f"""
{code}

# Test case
result = is_palindrome('{test_input}')
print(result)
"""
        elif challenge_id == 'two_sum':
            test_code = f"""
{code}

# Test case
result = two_sum({test_input['nums']}, {test_input['target']})
print(result)
"""
        else:
            return {'passed': False, 'error': 'Unknown challenge type'}
        
        # Execute test
        output = execute_python_code(test_code)
        
        # Parse output and compare
        try:
            actual_result = eval(output.strip())
            passed = actual_result == expected
            return {
                'passed': passed,
                'actual': actual_result,
                'output': output
            }
        except:
            return {
                'passed': False,
                'actual': output,
                'error': 'Could not parse output'
            }
            
    except Exception as e:
        return {'passed': False, 'error': str(e)}

def run_javascript_test_case(code, test_case, challenge_id):
    """Run a specific test case for JavaScript code"""
    try:
        test_input = test_case['input']
        expected = test_case['expected']
        
        # Modify code to test specific function based on challenge
        if challenge_id == 'array_reverse':
            test_code = f"""
{code}

// Test case
const result = reverseArray({json.dumps(test_input)});
console.log(JSON.stringify(result));
"""
        elif challenge_id == 'palindrome_check':
            test_code = f"""
{code}

// Test case
const result = isPalindrome('{test_input}');
console.log(result);
"""
        elif challenge_id == 'two_sum':
            test_code = f"""
{code}

// Test case
const result = twoSum({json.dumps(test_input['nums'])}, {test_input['target']});
console.log(JSON.stringify(result));
"""
        else:
            return {'passed': False, 'error': 'Unknown challenge type'}
        
        # Execute test
        output = execute_javascript_code(test_code)
        
        # Parse output and compare
        try:
            actual_result = json.loads(output.strip())
            passed = actual_result == expected
            return {
                'passed': passed,
                'actual': actual_result,
                'output': output
            }
        except:
            # For boolean results
            if output.strip().lower() in ['true', 'false']:
                actual_result = output.strip().lower() == 'true'
                passed = actual_result == expected
                return {
                    'passed': passed,
                    'actual': actual_result,
                    'output': output
                }
            return {
                'passed': False,
                'actual': output,
                'error': 'Could not parse output'
            }
            
    except Exception as e:
        return {'passed': False, 'error': str(e)}
    
    
@app.route('/api/leaderboard', methods=['POST'])
def leaderboard_post():
    try:
        data = request.get_json()
        filter_type = data.get('filter', 'overall')
        page = int(data.get('page', 1))
        page_size = int(data.get('pageSize', 10))

        users_ref = db.collection('users')
        users_query = users_ref

        # Determine sorting field based on filter
        if filter_type == 'quiz':
            order_field = 'stats.quizzes_completed'
        elif filter_type == 'coding':
            order_field = 'stats.challenges_solved'
        elif filter_type == 'monthly':
            now = datetime.now()
            month_start = datetime(now.year, now.month, 1)
            users_query = users_query.where('stats.last_activity', '>=', month_start)
            order_field = 'stats.total_score'
        else:
            order_field = 'stats.total_score'

        # Query Firestore
        query = users_query.order_by(order_field, direction=firestore.Query.DESCENDING).offset((page - 1) * page_size).limit(page_size)
        users_docs = query.stream()

        # Count total documents (for pagination)
        all_docs = users_query.stream()
        total_users = sum(1 for _ in all_docs)
        total_pages = (total_users + page_size - 1) // page_size

        # Build response data
        users = []
        for doc in users_docs:
            d = doc.to_dict()
            stats = d.get('stats', {})
            users.append({
                'name': d.get('name', 'Unknown'),
                'avatar': d.get('profile', {}).get('avatar_url', None),
                'quizzesCompleted': stats.get('quizzes_completed', 0),
                'challengesSolved': stats.get('challenges_solved', 0),
                'termsLearned': stats.get('terms_learned', 0),
                'totalScore': stats.get('total_score', 0),
                'quizScore': stats.get('quizzes_completed', 0) * 10,      # Sample score logic
                'codingScore': stats.get('challenges_solved', 0) * 20,    # Sample score logic
                'monthlyScore': stats.get('total_score', 0)               # Could be refined
            })

        return jsonify({
            'users': users,
            'totalPages': total_pages,
            'currentPage': page
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# User Profile Routes with Firebase Auth
@app.route('/api/profile', methods=['GET'])
@firebase_auth_required
def get_profile():
    try:
        uid = request.current_user['uid']
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404

        user_data = user_doc.to_dict()
        user_score = user_data.get('stats', {}).get('total_score', 0)

        # Fetch all users and calculate rank
        users_ref = db.collection('users').stream()
        scores = []
        for doc in users_ref:
            data = doc.to_dict()
            score = data.get('stats', {}).get('total_score', 0)
            scores.append((doc.id, score))

        # Sort descending and find rank
        scores.sort(key=lambda x: x[1], reverse=True)
        rank = next((i + 1 for i, (doc_id, score) in enumerate(scores) if doc_id == uid), None)

        return jsonify({
            'uid': uid,
            'name': user_data['name'],
            'email': user_data['email'],
            'email_verified': request.current_user.get('email_verified', False),
            'profile': user_data.get('profile', {}),
            'stats': user_data.get('stats', {}),
            'achievements': user_data.get('achievements', []),
            'preferences': user_data.get('preferences', {}),
            'created_at': user_data['created_at'].isoformat() if user_data.get('created_at') else None,
            'last_login': user_data['last_login'].isoformat() if user_data.get('last_login') else None,
            'rank': rank
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        users_ref = db.collection('users')
        users = users_ref.order_by('stats.total_score', direction=firestore.Query.DESCENDING).limit(10).stream()
        
        leaderboard = []
        rank = 1
        
        for doc in users:
            data = doc.to_dict()
            leaderboard.append({
                'rank': rank,
                'name': data['name'],
                'score': data.get('stats', {}).get('total_score', 0),
                'quizzes_completed': data.get('stats', {}).get('quizzes_completed', 0),
                'challenges_solved': data.get('stats', {}).get('challenges_solved', 0)
            })
            rank += 1
        
        return jsonify({'leaderboard': leaderboard}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Activity and Analytics
@app.route('/api/user/activity', methods=['GET'])
@firebase_auth_required
def get_user_activity():
    try:
        uid = request.current_user['uid']
        
        # Get recent quiz sessions
        quiz_sessions = db.collection('quiz_sessions')\
            .where('user_id', '==', uid)\
            .order_by('start_time', direction=firestore.Query.DESCENDING)\
            .limit(10).stream()
        
        # Get recent code submissions
        code_submissions = db.collection('code_submissions')\
            .where('user_id', '==', uid)\
            .order_by('submitted_at', direction=firestore.Query.DESCENDING)\
            .limit(10).stream()
        
        activity = {
            'quizzes': [],
            'coding_challenges': []
        }
        
        for session in quiz_sessions:
            data = session.to_dict()
            activity['quizzes'].append({
                'id': session.id,
                'category': data['category'],
                'score': data.get('score', 0),
                'completed_at': data.get('completed_at').isoformat() if data.get('completed_at') else None,
                'status': data['status']
            })
        
        for submission in code_submissions:
            data = submission.to_dict()
            activity['coding_challenges'].append({
                'id': submission.id,
                'challenge_id': data['challenge_id'],
                'success': data['success'],
                'passed_tests': data['passed_tests'],
                'total_tests': data['total_tests'],
                'submitted_at': data['submitted_at'].isoformat() if data.get('submitted_at') else None
            })
        
        return jsonify({'activity': activity}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize sample data
@app.route('/api/init-sample-data', methods=['POST'])
def init_sample_data():
    try:
        # Sample quiz categories
        categories = [
            {
                'name': 'Programming',
                'description': 'Test your programming concepts',
                'difficulty': 'Easy - Hard',
                'question_count': 50
            },
            {
                'name': 'Networking',
                'description': 'Network protocols and concepts',
                'difficulty': 'Medium - Hard',
                'question_count': 30
            },
            {
                'name': 'Cybersecurity',
                'description': 'Security principles and practices',  
                'difficulty': 'Medium - Expert',
                'question_count': 40
            },
            {
                'name': 'Algorithms',
                'description': 'Data structures and algorithms',
                'difficulty': 'Medium - Expert',
                'question_count': 35
            },
            {
                'name': 'Databases',
                'description': 'Database design and management',
                'difficulty': 'Easy - Hard',
                'question_count': 25
            }
        ]
        
        for category in categories:
            db.collection('quiz_categories').add(category)
        
        # Sample questions
        sample_questions = [
            {
                'category': 'programming',
                'question': 'What does API stand for?',
                'options': [
                    'Application Programming Interface',
                    'Advanced Programming Interface', 
                    'Application Process Interface',
                    'Automated Programming Interface'
                ],
                'correct_answer': 0,
                'explanation': 'API stands for Application Programming Interface, which defines how software components communicate.'
            },
            {
                'category': 'programming',
                'question': 'Which of the following is NOT a valid Python data type?',
                'options': ['list', 'tuple', 'array', 'dictionary'],
                'correct_answer': 2,
                'explanation': 'Array is not a built-in Python data type. Python uses lists instead of arrays.'
            },
            {
                'category': 'networking',
                'question': 'Which protocol is used for secure web browsing?',
                'options': ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
                'correct_answer': 1,
                'explanation': 'HTTPS (HTTP Secure) uses SSL/TLS encryption for secure web communication.'
            },
            {
                'category': 'networking',
                'question': 'What is the default port for SSH?',
                'options': ['21', '22', '23', '25'],
                'correct_answer': 1,
                'explanation': 'SSH (Secure Shell) uses port 22 by default for secure remote access.'
            },
            {
                'category': 'cybersecurity',
                'question': 'What does SQL injection attack target?',
                'options': ['Web servers', 'Databases', 'Email servers', 'DNS servers'],
                'correct_answer': 1,
                'explanation': 'SQL injection attacks target databases by inserting malicious SQL code through application inputs.'
            },
            {
                'category': 'algorithms',
                'question': 'What is the time complexity of binary search?',
                'options': ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
                'correct_answer': 1,
                'explanation': 'Binary search has O(log n) time complexity as it eliminates half the search space in each iteration.'
            },
            {
                'category': 'databases',
                'question': 'What does ACID stand for in database systems?',
                'options': [
                    'Atomicity, Consistency, Isolation, Durability',
                    'Association, Consistency, Integration, Database',
                    'Atomicity, Connection, Isolation, Database',
                    'Association, Connection, Integration, Durability'
                ],
                'correct_answer': 0,
                'explanation': 'ACID represents the four key properties that guarantee reliable database transactions.'
            }
        ]
        
        for question in sample_questions:
            db.collection('quiz_questions').add(question)
        
        # Sample coding challenges
        challenges = [
            {
                'title': 'Array Manipulation',
                'description': 'Complete the function to reverse an array without using built-in methods.',
                'difficulty': 'easy',
                'category': 'arrays',
                'problem_statement': '''
Write a function that reverses an array without using built-in reverse methods.

Example:
Input: [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]

Constraints:
- Do not use built-in reverse() method
- Time complexity should be O(n)
- Space complexity should be O(1)
                ''',
                'starter_code': '''def reverse_array(arr):
    # Your code here
    # Reverse the array in-place
    pass

# Test your function
test_array = [1, 2, 3, 4, 5]
print(reverse_array(test_array))''',
                'test_cases': [
                    {'input': [1, 2, 3, 4, 5], 'expected': [5, 4, 3, 2, 1]},
                    {'input': [1], 'expected': [1]},
                    {'input': [], 'expected': []},
                    {'input': [1, 2], 'expected': [2, 1]}
                ],
                'solved_count': 234,
                'rating': 4.5,
                'examples': [
                    {
                        'input': '[1, 2, 3, 4, 5]',
                        'output': '[5, 4, 3, 2, 1]',
                        'explanation': 'The array is reversed by swapping elements from both ends.'
                    }
                ]
            },
            {
                'title': 'Two Sum Problem',
                'description': 'Find two numbers in an array that add up to a target sum.',
                'difficulty': 'medium',
                'category': 'arrays',
                'problem_statement': '''
Given an array of integers and a target sum, return the indices of two numbers that add up to the target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)
                ''',
                'starter_code': '''def two_sum(nums, target):
    # Your code here
    # Return indices of the two numbers
    pass

# Test your function
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))''',
                'test_cases': [
                    {'input': {'nums': [2, 7, 11, 15], 'target': 9}, 'expected': [0, 1]},
                    {'input': {'nums': [3, 2, 4], 'target': 6}, 'expected': [1, 2]},
                    {'input': {'nums': [3, 3], 'target': 6}, 'expected': [0, 1]}
                ],
                'solved_count': 156,
                'rating': 4.2,
                'examples': [
                    {
                        'input': 'nums = [2, 7, 11, 15], target = 9',
                        'output': '[0, 1]',
                        'explanation': 'nums[0] + nums[1] = 2 + 7 = 9'
                    }
                ]
            },
            {
                'title': 'Fibonacci Sequence',
                'description': 'Generate the nth Fibonacci number using dynamic programming.',
                'difficulty': 'easy',
                'category': 'dynamic-programming',
                'problem_statement': '''
Write a function to find the nth Fibonacci number.
The Fibonacci sequence is: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...

Where F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n > 1.

Example:
Input: n = 6
Output: 8 (the 6th Fibonacci number)
                ''',
                'starter_code': '''def fibonacci(n):
    # Your code here
    # Return the nth Fibonacci number
    pass

# Test your function
n = 6
print(fibonacci(n))''',
                'test_cases': [
                    {'input': 0, 'expected': 0},
                    {'input': 1, 'expected': 1},
                    {'input': 6, 'expected': 8},
                    {'input': 10, 'expected': 55}
                ],
                'solved_count': 342,
                'rating': 4.7,
                'examples': [
                    {
                        'input': 'n = 6',
                        'output': '8',
                        'explanation': 'F(6) = F(5) + F(4) = 5 + 3 = 8'
                    }
                ]
            }
        ]
        
        for challenge in challenges:
            db.collection('coding_challenges').add(challenge)
        
        # Sample dictionary terms
        dictionary_terms = [
            {
                'term': 'Algorithm',
                'definition': 'A step-by-step procedure for solving a problem or completing a task.',
                'category': 'algorithms',
                'examples': [
                    'Sorting algorithms like quicksort and mergesort',
                    'Search algorithms like binary search',
                    'Graph algorithms like Dijkstra\'s shortest path'
                ],
                'related_terms': ['Data Structure', 'Complexity', 'Optimization'],
                'source': 'curated'
            },
            {
                'term': 'API',
                'definition': 'Application Programming Interface - a set of protocols and tools for building software applications.',
                'category': 'programming',
                'examples': [
                    'REST APIs for web services',
                    'Database APIs for data access',
                    'Operating system APIs for system calls'
                ],
                'related_terms': ['REST', 'HTTP', 'JSON'],
                'source': 'curated'
            },
            {
                'term': 'Firewall',
                'definition': 'A network security system that monitors and controls incoming and outgoing network traffic.',
                'category': 'cybersecurity',
                'examples': [
                    'Hardware firewalls protecting entire networks',
                    'Software firewalls on individual computers',
                    'Web application firewalls protecting web servers'
                ],
                'related_terms': ['Network Security', 'Packet Filtering', 'Intrusion Detection'],
                'source': 'curated'
            },
            {
                'term': 'Database',
                'definition': 'An organized collection of structured information or data stored electronically in a computer system.',
                'category': 'databases',
                'examples': [
                    'Relational databases like MySQL and PostgreSQL',
                    'NoSQL databases like MongoDB and Redis',
                    'Graph databases like Neo4j'
                ],
                'related_terms': ['SQL', 'CRUD', 'Normalization'],
                'source': 'curated'
            },
            {
                'term': 'TCP/IP',
                'definition': 'Transmission Control Protocol/Internet Protocol - the basic communication language of the Internet.',
                'category': 'networking',
                'examples': [
                    'Web browsing using HTTP over TCP/IP',
                    'Email transmission using SMTP over TCP/IP',
                    'File transfer using FTP over TCP/IP'
                ],
                'related_terms': ['HTTP', 'OSI Model', 'Packet'],
                'source': 'curated'
            }
        ]
        
        for term in dictionary_terms:
            term['created_at'] = datetime.now()
            db.collection('dictionary_terms').add(term)
        
        return jsonify({'message': 'Sample data initialized successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    }), 200

# Custom error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(403)
def forbidden_error(error):
    return jsonify({'error': 'Forbidden access'}), 403

if __name__ == "__main__":
    # Set port for Render compatibility
    port = int(os.environ.get("PORT", 5000))
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=port)
