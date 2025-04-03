"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AcceptInviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Traitement de votre invitation...");

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token d'invitation manquant");
        return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          router.push(`/auth/login?redirect=/accept-invite&token=${token}`);
          return;
        }

        const { data, error } = await supabase.rpc("accept_invitation_rpc", {
          invitation_token: token,
        });

        if (error) {
          console.error("Erreur RPC:", error);
          setStatus("error");
          setMessage("Une erreur est survenue lors de l'acceptation de l'invitation. Veuillez réessayer.");
          return;
        }

        if (!data.success) {
          setStatus("error");
          setMessage(data.error || "Échec de l'acceptation de l'invitation");
          return;
        }

        if (data.already_accepted) {
          setStatus("success");
          setMessage("Cette invitation a déjà été acceptée");
        } else {
          setStatus("success");
          setMessage("Invitation acceptée avec succès!");
        }

        setTimeout(() => {
          router.push(`/list/${data.list_id}`);
        }, 1500);
      } catch (error) {
        console.error("Erreur générale:", error);
        setStatus("error");
        setMessage("Une erreur inattendue est survenue");
      }
    };

    processInvitation();
  }, [token, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          {status === "loading" ? "Traitement de votre invitation" :
           status === "success" ? "Invitation acceptée" : "Erreur"}
        </h1>
        <p className={`${status === "error" ? "text-red-600" : "text-gray-600"}`}>{message}</p>
        
        {status === "error" && (
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        )}
        
        {status === "success" && (
          <p className="text-sm text-gray-500 mt-4">
            Redirection automatique...
          </p>
        )}
      </div>
    </div>
  );
}