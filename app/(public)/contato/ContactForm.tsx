"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createContactIdempotencyKey, idempotencyKeyAfterAttempt } from "../../../lib/contact-idempotency";

type Topic = { id: string; name: string; slug: string };

export function ContactForm({ topics }: { topics: Topic[] }) {
  const searchParams = useSearchParams();
  const defaultTopic = searchParams.get("assunto") || "";
  const artist = searchParams.get("artista") || "";
  const idempotencyKey = useRef(createContactIdempotencyKey());
  const [state, setState] = useState<{ status: "idle" | "sending" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending", message: "Enviando..." });

    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const payload = {
      idempotencyKey: idempotencyKey.current,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      topicSlug: String(form.get("topicSlug") || ""),
      message: String(form.get("message") || ""),
      consent: form.get("consent") === "on",
      website: String(form.get("website") || ""),
      source: "lander-records-site",
      pagePath: window.location.pathname,
      referrer: document.referrer,
      utm: {
        source: params.get("utm_source") || "",
        medium: params.get("utm_medium") || "",
        campaign: params.get("utm_campaign") || "",
        term: params.get("utm_term") || "",
        content: params.get("utm_content") || "",
      },
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a mensagem.");
      event.currentTarget.reset();
      idempotencyKey.current = idempotencyKeyAfterAttempt(idempotencyKey.current, true);
      setState({ status: "success", message: "Mensagem enviada com sucesso. Nossa equipe recebeu seu contato." });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Falha ao enviar a mensagem." });
    }
  }

  return (
    <form className="contactForm" onSubmit={submit} noValidate>
      <label>Nome<input name="name" autoComplete="name" required minLength={2} maxLength={180} placeholder="Seu nome" /></label>
      <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={320} placeholder="voce@email.com" /></label>
      <label>Telefone<input name="phone" type="tel" autoComplete="tel" maxLength={80} placeholder="(00) 00000-0000" /></label>
      <label>Assunto
        <select name="topicSlug" defaultValue={topics.some((topic) => topic.slug === defaultTopic) ? defaultTopic : ""} required>
          <option value="" disabled>Selecione</option>
          {topics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}
        </select>
      </label>
      <label className="fullField">Mensagem<textarea name="message" required minLength={10} maxLength={5000} rows={6} defaultValue={artist ? `Olá, gostaria de falar sobre contratação de ${artist}.` : ""} placeholder="Conte um pouco sobre o projeto" /></label>
      <label className="contactConsent fullField"><input name="consent" type="checkbox" required /> <span>Autorizo o tratamento dos meus dados para retorno deste contato e registro do atendimento.</span></label>
      <label className="contactHoneypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="fullField">
        <button className="button buttonPrimary" type="submit" disabled={state.status === "sending"}>{state.status === "sending" ? "Enviando..." : "Enviar mensagem"}</button>
        {state.message ? <p className={`contactFormStatus ${state.status}`} role="status">{state.message}</p> : null}
      </div>
    </form>
  );
}
