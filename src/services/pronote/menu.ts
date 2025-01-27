import { PronoteAccount } from "@/stores/account/types";
import { ErrorServiceUnauthenticated } from "../shared/errors";
import pronote, { Menu } from "pawnote";
import {reloadInstance} from "@/services/pronote/reload-instance";

export const getMenu = async (account: PronoteAccount, date: Date): Promise<Menu> => {
  try {
    if (!account.instance) {
      throw new ErrorServiceUnauthenticated("pronote");
    }

    const menu = await pronote.menus(account.instance, date);
    if (!menu.days || menu.days.length === 0) {
      return { date };
    }
    const day = menu.days[0];

    if (day.date?.getTime() !== date.getTime()) {
      return { date };
    }

    return day;
  } catch (e) {
    if (e instanceof Error && e.name === "SessionExpiredError") {
      await reloadInstance(account.authentication);
      return getMenu(account, date);
    } else {
      throw e;
    }
  }
};
