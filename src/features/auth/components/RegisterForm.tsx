import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Loader2 } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { registerSchema } from "../schemas/auth.schema";
import { useAuthService } from "../hooks/useAuthService";
import type { RegisterCredentials } from "../types";
import { useEffect, useState } from "react";

export function RegisterForm() {
  const { register: registerUser } = useAuthService();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await registerUser(data);
      setRedirectTo("/");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  });

  useEffect(() => {
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  }, [redirectTo]);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.root?.message && (
        <ErrorAlert errorMessage={errors.root.message} onDismiss={() => setError("root", { message: "" })} />
      )}

      <AuthInput
        label="Email address"
        type="email"
        {...register("email")}
        error={errors.email?.message}
        disabled={isSubmitting}
        autoComplete="email"
        placeholder="Enter your email address"
      />

      <AuthInput
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
        disabled={isSubmitting}
        autoComplete="new-password"
        showPasswordToggle
        placeholder="Create a password"
        hint="Must be at least 8 characters"
      />

      <AuthInput
        label="Confirm Password"
        type="password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
        disabled={isSubmitting}
        autoComplete="new-password"
        showPasswordToggle
        placeholder="Confirm your password"
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </a>
      </div>
    </form>
  );
}
