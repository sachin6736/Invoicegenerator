// // src/pages/Register.jsx
// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import { useAuth } from '../context/AuthContext';
// import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

// const API = import.meta.env.VITE_API_URL;

// export default function Register() {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   // Real-time field validation
//   const validateField = (name, value) => {
//     let error = '';

//     switch (name) {
//       case 'name':
//         if (!value.trim()) error = 'Full name is required';
//         else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
//         else if (value.trim().length > 50) error = 'Name cannot exceed 50 characters';
//         break;

//       case 'email':
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!value.trim()) error = 'Email is required';
//         else if (!emailRegex.test(value.trim())) error = 'Please enter a valid email address';
//         break;

//       case 'password':
//         if (!value) error = 'Password is required';
//         else if (value.length < 12) error = 'Password must be at least 12 characters';
//         else if (value.length > 128) error = 'Password is too long (max 128 characters)';
//         else if (!/[A-Z]/.test(value)) error = 'Must contain at least 1 uppercase letter';
//         else if (!/[a-z]/.test(value)) error = 'Must contain at least 1 lowercase letter';
//         else if (!/[0-9]/.test(value)) error = 'Must contain at least 1 number';
//         else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
//           error = 'Must contain at least 1 special character';
//         break;

//       case 'confirmPassword':
//         if (!value) error = 'Please confirm your password';
//         else if (value !== formData.password) error = 'Passwords do not match';
//         break;

//       default:
//         break;
//     }

//     return error;
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     Object.keys(formData).forEach((field) => {
//       const error = validateField(field, formData[field]);
//       if (error) newErrors[field] = error;
//     });

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (touched[name]) {
//       const error = validateField(name, value);
//       setErrors((prev) => ({ ...prev, [name]: error }));
//     }
//   };

//   const handleBlur = (e) => {
//     const { name, value } = e.target;
//     setTouched((prev) => ({ ...prev, [name]: true }));
//     const error = validateField(name, value);
//     setErrors((prev) => ({ ...prev, [name]: error }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       toast.error('Please fix the errors in the form');
//       return;
//     }

//     setLoading(true);

//     try {
//       const res = await fetch(`${API}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: formData.name.trim(),
//           email: formData.email.trim(),
//           password: formData.password,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         // Handle "User already exists" specifically
//         if (data.message === "User already exists" && data.field === "email") {
//           setErrors((prev) => ({ ...prev, email: "User already exists" }));
//           toast.error("This email is already registered. Please use a different email or log in.");
//         } else {
//           throw new Error(data.message || 'Registration failed');
//         }
//         return;
//       }

//       login(data.token, data.user);

//       toast.success('Account created successfully!', {
//         description: 'You can now log in.',
//         duration: 5000,
//         position: 'top-right',
//       });

//       setSuccess(true);
//     } catch (err) {
//       toast.error(err.message || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Success screen
//   if (success) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-md w-full space-y-8 text-center">
//           <div className="space-y-6">
//             <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
//               <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             </div>

//             <h2 className="text-3xl font-extrabold text-gray-900">
//               Account Created Successfully!
//             </h2>

//             <p className="text-lg text-gray-600">
//               Congratulations! Your account has been created.<br />
//               <span className="font-medium">Now you have to log in</span> to start using the app.
//             </p>

//             <div className="mt-8 space-y-4">
//               <button
//                 onClick={() => navigate('/login')}
//                 className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium text-lg transition-colors"
//               >
//                 Go to Login
//               </button>

//               <button
//                 onClick={() => setSuccess(false)}
//                 className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
//               >
//                 Register Another Account
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Registration form with real-time validation
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             Create your account
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             Already have an account?{' '}
//             <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
//               Sign in
//             </Link>
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           {/* Name */}
//           <div>
//             <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//               Full Name
//             </label>
//             <div className="mt-1 relative">
//               <input
//                 id="name"
//                 name="name"
//                 type="text"
//                 value={formData.name}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={`appearance-none block w-full px-3 py-2 border ${
//                   touched.name && errors.name
//                     ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
//                     : touched.name && !errors.name
//                     ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
//                     : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
//                 } rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors`}
//                 placeholder="Full name"
//               />
//               {touched.name && (
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
//                   {errors.name ? (
//                     <XCircle className="h-5 w-5 text-red-500" />
//                   ) : (
//                     <CheckCircle className="h-5 w-5 text-green-500" />
//                   )}
//                 </div>
//               )}
//             </div>
//             {touched.name && errors.name && (
//               <p className="mt-1 text-sm text-red-600">{errors.name}</p>
//             )}
//           </div>

//           {/* Email */}
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//               Email address
//             </label>
//             <div className="mt-1 relative">
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={`appearance-none block w-full px-3 py-2 border ${
//                   touched.email && errors.email
//                     ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
//                     : touched.email && !errors.email
//                     ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
//                     : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
//                 } rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors`}
//                 placeholder="Email address"
//               />
//               {touched.email && (
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
//                   {errors.email ? (
//                     <XCircle className="h-5 w-5 text-red-500" />
//                   ) : (
//                     <CheckCircle className="h-5 w-5 text-green-500" />
//                   )}
//                 </div>
//               )}
//             </div>
//             {touched.email && errors.email && (
//               <p className="mt-1 text-sm text-red-600">{errors.email}</p>
//             )}
//           </div>

//           {/* Password */}
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//               Password
//             </label>
//             <div className="mt-1 relative">
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? 'text' : 'password'}
//                 autoComplete="new-password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={`appearance-none block w-full px-3 py-2 border pr-10 ${
//                   touched.password && errors.password
//                     ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
//                     : touched.password && !errors.password
//                     ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
//                     : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
//                 } rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors`}
//                 placeholder="Password"
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? (
//                   <EyeOff className="h-5 w-5 text-gray-500" />
//                 ) : (
//                   <Eye className="h-5 w-5 text-gray-500" />
//                 )}
//               </button>
//             </div>

//             {touched.password && errors.password && (
//               <p className="mt-1 text-sm text-red-600">{errors.password}</p>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
//               Confirm Password
//             </label>
//             <div className="mt-1 relative">
//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type={showConfirmPassword ? 'text' : 'password'}
//                 autoComplete="new-password"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={`appearance-none block w-full px-3 py-2 border pr-10 ${
//                   touched.confirmPassword && errors.confirmPassword
//                     ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
//                     : touched.confirmPassword && !errors.confirmPassword
//                     ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
//                     : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
//                 } rounded-md shadow-sm focus:outline-none sm:text-sm transition-colors`}
//                 placeholder="Confirm password"
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               >
//                 {showConfirmPassword ? (
//                   <EyeOff className="h-5 w-5 text-gray-500" />
//                 ) : (
//                   <Eye className="h-5 w-5 text-gray-500" />
//                 )}
//               </button>
//             </div>
//             {touched.confirmPassword && errors.confirmPassword && (
//               <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
//             )}
//           </div>

//           <div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
//                 loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
//               } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
//             >
//               {loading ? 'Creating account...' : 'Create account'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// } 