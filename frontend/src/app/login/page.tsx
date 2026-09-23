"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { ErrorModal, IfpeBrand } from "@/components/ui";
import { loginSchema, LoginData } from "@/schemas/auth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { useLogin } from "@/hooks/queries/useAuth";
import cowMascot from "@/assets/vaca.png";
import googleLogo from "@/assets/image-removebg-preview.png";
import loginBackground from "@/assets/fundo.png";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "/api";

function GoogleLoginError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
      {error}
    </p>
  );
}

export default function Login() {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { mutate: login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });
  const submitting = isPending || isSubmitting;

  const onSubmit = (data: LoginData) =>
    login(data, {
      onError: (error: unknown) => {
        console.error(error);
        setErrorMessage(getFriendlyErrorMessage(error));
        setShowErrorModal(true);
      },
    });

  return (
    <main
      className="login-home"
      style={{ backgroundImage: `url(${loginBackground.src})` }}
    >
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <div className="login-home__frame">
        <section className="login-home__story" aria-labelledby="login-headline">
          <IfpeBrand className="login-home__brand" />
          <h1 id="login-headline" className="login-home__headline">
            A gestão inteligente da <strong>Produção Leiteira.</strong>
          </h1>
          <div className="login-home__mascot" aria-hidden="true">
            <Image
              src={cowMascot}
              alt=""
              priority
              sizes="(max-width: 767px) 46vw, 38vw"
            />
          </div>
        </section>

        <section className="login-home__panel" aria-labelledby="login-title">
          <div className="login-home__form-card">
            <header>
              <h2 id="login-title">Entrar</h2>
              <p>Acesse sua conta para continuar</p>
            </header>

            <Suspense fallback={null}>
              <GoogleLoginError />
            </Suspense>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="login-home__form"
            >
              <div>
                <label htmlFor="email" className="sr-only">
                  E-mail
                </label>
                <div className="login-home__field">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="E-mail"
                    disabled={submitting}
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="login-home__error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Senha
                </label>
                <div className="login-home__field">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Senha"
                    disabled={submitting}
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="login-home__error">{errors.password.message}</p>
                )}
              </div>

              <Link href="/forgotPassword" className="login-home__forgot">
                Esqueceu sua senha?
              </Link>
              <button
                type="submit"
                className="login-home__submit"
                disabled={submitting}
              >
                <span>{submitting ? "Entrando..." : "Entrar"}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <div className="login-home__divider">
              <span>ou</span>
            </div>
            <a
              href={`${API_ORIGIN}/auth/google`}
              className="login-home__google"
            >
              <Image
                src={googleLogo}
                alt=""
                className="login-home__google-logo"
              />
              Entrar com o Google
            </a>
            <p className="login-home__signup">
              Não possui uma conta?{" "}
              <Link href="/createAccount">Cadastre-se</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
