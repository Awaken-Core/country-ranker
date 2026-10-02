"use client"

import Image from "next/image"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client"
import { GoogleIcon } from "@/components/auth/google-svg"

export default function Home() {
  const { data: session, isPending: isSessionPending } = useSession()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLogin = mode === "login"
  const initials = session?.user.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || session?.user.email?.[0]?.toUpperCase() || "U"

  const changeMode = () => {
    setMode(isLogin ? "register" : "login")
    setError(null)
  }

  const handleCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email"))
    const password = String(formData.get("password"))

    try {
      const result = isLogin
        ? await signIn.email({ email, password, callbackURL: "/" })
        : await signUp.email({ name: String(formData.get("name")), email, password, callbackURL: "/" })

      if (result.error) setError(result.error.message ?? "Something went wrong. Please try again.")
    } catch {
      setError("Unable to connect. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await signIn.social({ provider: "google", callbackURL: "/" })
      if (result?.error) {
        setError(result.error.message ?? "Google sign-in failed. Please try again.")
        setIsSubmitting(false)
      }
    } catch {
      setError("Google sign-in is unavailable right now. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {isSessionPending ? (
        <Button variant="outline" disabled>Loading…</Button>
      ) : session?.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 rounded-full pr-3 pl-1">
              <Avatar size="sm">
                {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name || "User"} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-36 truncate">{session.user.name || session.user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="min-w-0">
              <p className="truncate font-medium">{session.user.name || "My account"}</p>
              <p className="truncate font-normal text-muted-foreground">{session.user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
      <Dialog>
        <DialogTrigger asChild><Button variant="outline">Sign in</Button></DialogTrigger>
        <DialogContent className="overflow-hidden p-0 sm:max-w-2xl md:grid md:grid-cols-[0.9fr_1.1fr] md:gap-0">
          <div className="relative min-h-36 overflow-hidden md:min-h-[34rem]">
            <Image src="/image/auth.png" alt="City skyline glowing beside the harbour at night" fill priority unoptimized sizes="(min-width: 768px) 300px, calc(100vw - 2rem)" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-base font-semibold tracking-tight">Let&apos;s get started here.</p>
              <p className="mt-1 text-xs text-white/75">vote for your country and be on top.</p>
            </div>
          </div>

          <form onSubmit={handleCredentials} className="flex flex-col justify-center gap-5 p-6 sm:p-8">
            <DialogHeader className="gap-2">
              <DialogTitle className="text-xl font-semibold tracking-tight">{isLogin ? "Welcome back" : "Create your account"}</DialogTitle>
              <DialogDescription>{isLogin ? "Sign in to continue planning your next adventure." : "Join us and start planning memorable trips."}</DialogDescription>
            </DialogHeader>

            <Button type="button" variant="outline" size="lg" className="h-7 w-full gap-2" disabled={isSubmitting} onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </Button>
            <FieldSeparator>or continue with email</FieldSeparator>

            <FieldGroup className="gap-3">
              {!isLogin && <Field><Label htmlFor="auth-name">Full name</Label><Input id="auth-name" name="name" autoComplete="name" placeholder="Jane Smith" required /></Field>}
              <Field><Label htmlFor="auth-email">Email address</Label><Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></Field>
              <Field>
                <Label htmlFor="auth-password">Password</Label>
                <Input id="auth-password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 8 characters" minLength={8} required />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>

            <Button type="submit" size="lg" className="h-7 w-full" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}</Button>
            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "New here?" : "Already have an account?"}{" "}
              <button type="button" onClick={changeMode} className="font-medium text-foreground underline-offset-4 hover:underline">{isLogin ? "Create an account" : "Sign in"}</button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
};
