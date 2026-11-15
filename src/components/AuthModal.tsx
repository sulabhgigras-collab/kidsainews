import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  onEmailSignUp: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
}

const AuthModal = ({ open, onClose, onEmailSignIn, onEmailSignUp }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = mode === "login"
      ? await onEmailSignIn(email, password)
      : await onEmailSignUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-sm mx-4 bg-card border-4 border-foreground rounded-xl overflow-hidden"
          style={{ boxShadow: "6px 6px 0px hsl(var(--foreground))" }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="bg-primary px-5 py-4 flex items-center justify-between border-b-3 border-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐿️</span>
              <span className="font-bangers text-xl text-primary-foreground tracking-wider">
                {mode === "login" ? "Welcome Back!" : "Join KidsAINews!"}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-primary-foreground/10 rounded-lg transition">
              <X className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-bangers text-xs tracking-wide text-foreground uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 bg-background border-2 border-foreground/30 rounded-lg font-comic font-bold text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="font-bangers text-xs tracking-wide text-foreground uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full mt-1 px-3 py-2 bg-background border-2 border-foreground/30 rounded-lg font-comic font-bold text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && (
                <p className="font-comic font-bold text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              {success && (
                <p className="font-comic font-bold text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  {success}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full comic-banner flex items-center justify-center gap-2 bg-secondary text-foreground px-4 py-3 rounded-none font-bangers tracking-wide text-sm disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                <Mail className="w-4 h-4" />
                {loading ? "..." : mode === "login" ? "Log In" : "Sign Up"}
              </motion.button>
            </form>

            <p className="text-center font-comic font-bold text-xs text-muted-foreground">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} className="text-primary hover:underline">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} className="text-primary hover:underline">
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
