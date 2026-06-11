export const getAuthErrorMessage = (error: unknown, mode: "login" | "signup") => {
  const rawMessage = error instanceof Error ? error.message : String(error || "");
  const message = rawMessage.toLowerCase();

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many signup emails were requested. Please wait a few minutes before trying again.";
  }

  if (message.includes("invalid login credentials")) {
    return mode === "login"
      ? "Invalid email or password. If you just created your account, verify your email before logging in."
      : "Invalid account credentials. Please check the email and password and try again.";
  }

  if (message.includes("email not confirmed") || message.includes("confirm")) {
    return "Please verify your email before logging in.";
  }

  return rawMessage || (mode === "login" ? "Failed to log in" : "Failed to create account");
};

export const isRateLimitError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return message.includes("rate limit") || message.includes("too many");
};
