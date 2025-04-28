import type { PronoteAccount } from "@/stores/account/types";
import pronote from "pawnote";
import { Reconnected } from "../reload-account";
import { useCurrentAccount } from "@/stores/account";

export const reloadInstance = async (authentication: PronoteAccount["authentication"]): Promise<Reconnected<PronoteAccount>> => {
  const session = pronote.createSessionHandle();
  const { mutateProperty } = useCurrentAccount.getState();
  let refresh;
  try {
    console.log("Reloading instance");
    refresh = await pronote.loginToken(session, authentication);
    console.log("Instance reloaded");
    mutateProperty("error", false);
  } catch (error) {
    console.error("Error reloading instance", error);
    mutateProperty("error", true);
    throw error;
  }
  pronote.startPresenceInterval(session);

  return {
    instance: session,
    authentication: {
      ...authentication,
      ...refresh
    }
  };
};
