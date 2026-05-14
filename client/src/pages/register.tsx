import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function RegisterRedirect() {
  const [, setLocation] = useLocation();
  const { openAuth, user } = useAuth();
  useEffect(() => {
    if (user) {
      setLocation("/");
    } else {
      openAuth("signup");
      setLocation("/");
    }
  }, [openAuth, setLocation, user]);
  return null;
}
