import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import { ServiceCard } from "./types";

export const useCardsStore = create<{
  addCard: (card: ServiceCard) => void;
  removeCard: (identifier: string) => void;
  hasCard: (identifier: string) => boolean;
  cards: ServiceCard[];
}>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard (card) {
        set((state) => ({
          cards: [...new Set([...state.cards, card])]
        }));
      },

      removeCard (identifier) {
        set((state) => ({
          cards: state.cards.filter((card) => card.identifier !== identifier)
        }));
      },

      hasCard (identifier) {
        return get().cards.some((card) => card.identifier === identifier);
      }
    }),
    {
      name: "cards-storage",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);