import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Loader2 } from "lucide-react";
import { AuthInput } from "@/components/ui/AuthInput";
import { resetPasswordSchema } from "../schemas/auth.schema";
import { useAuthService } from "../hooks/useAuthService";
import type { ResetPasswordCredentials } from "../types";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword } = useAuthService();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordCredentials>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await resetPassword({ ...data, token });
      window.location.href = "/auth/login";
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
        label="New Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
        disabled={isSubmitting}
        autoComplete="new-password"
        showPasswordToggle
        placeholder="Enter your new password"
        hint="Must be at least 8 characters"
      />

      <AuthInput
        label="Confirm New Password"
        type="password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
        disabled={isSubmitting}
        autoComplete="new-password"
        showPasswordToggle
        placeholder="Confirm your new password"
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset password"
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
