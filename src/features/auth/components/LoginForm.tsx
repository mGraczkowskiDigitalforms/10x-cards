import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Loader2 } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { loginSchema } from "../schemas/auth.schema";
import { useAuthService } from "../hooks/useAuthService";
import type { LoginCredentials } from "../types";

export function LoginForm() {
  const { login } = useAuthService();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data);
      window.location.href = "/generate";
    } catch (err) {
      console.log("Login error:", err);
      if (err instanceof Error) {
        console.log("Setting error message:", err.message);
        setError("root", { message: err.message });
      } else {
        console.log("Setting generic error message");
        setError("root", { message: "An unexpected error occurred" });
      }
    }
  });

  console.log("Form errors:", errors);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate data-test-id="login-form">
      {errors.root?.message && (
        <ErrorAlert
          errorMessage={errors.root.message}
          onDismiss={() => setError("root", { message: "" })}
          data-test-id="login-error-message"
        />
      )}

      <AuthInput
        label="Email address"
        type="email"
        {...register("email")}
        error={errors.email?.message}
        disabled={isSubmitting}
        autoComplete="email"
        placeholder="Enter your email address"
        data-test-id="login-email-input"
      />

      <AuthInput
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
        disabled={isSubmitting}
        autoComplete="current-password"
        showPasswordToggle
        placeholder="Enter your password"
        data-test-id="login-password-input"
      />

      <div className="flex items-center justify-end">
        <a
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
          data-test-id="forgot-password-link"
        >
          Forgot password?
        </a>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} data-test-id="login-submit-button">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <a href="/auth/register" className="font-medium text-primary hover:underline">
          Sign up
        </a>
      </div>
    </form>
  );
}
