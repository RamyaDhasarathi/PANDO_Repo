import SignIn from '../sign-in/page';

export default function SignUp() {
  // Since we use passwordless OTP, Sign Up and Sign In flows are identical.
  // We can just reuse the SignIn component.
  return <SignIn />;
}
