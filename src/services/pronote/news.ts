import { PronoteAccount } from "@/stores/account/types";
import { Information } from "../shared/Information";
import { ErrorServiceUnauthenticated } from "../shared/errors";
import pronote from "pawnote";
import { decodeAttachment } from "./attachment";
import {reloadInstance} from "@/services/pronote/reload-instance";

const parseInformation = (i: pronote.NewsInformation): Information => ({
  id: i.id,
  title: i.title,
  date: i.startDate,
  acknowledged: i.acknowledged,
  attachments: i.attachments.map(decodeAttachment),
  content: i.content,
  author: i.author,
  category: i.category.name,
  read: i.read,
  ref: i,
});

export const getNews = async (account: PronoteAccount): Promise<Information[]> => {
  try {
    if (!account.instance)
      throw new ErrorServiceUnauthenticated("pronote");

    const news = await pronote.news(account.instance);
    const informations = news.items.filter(n => n.is === "information") as pronote.NewsInformation[];
    return informations.map(parseInformation);
  } catch (e) {
    if (e instanceof Error && e.name === "SessionExpiredError") {
      await reloadInstance(account.authentication);
      return getNews(account);
    } else {
      throw e;
    }
  }
};
