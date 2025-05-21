import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Loader2 } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { forgotPasswordSchema } from "../schemas/auth.schema";
import { useAuthService } from "../hooks/useAuthService";
import type { ForgotPasswordCredentials } from "../types";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuthService();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordCredentials>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await forgotPassword(data);
      window.location.href = "/auth/reset-password";
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  });

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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <div className="text-center text-sm">
        Remember your password?{" "}
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </a>
      </div>
    </form>
  );
}
