import { useTheme } from "@react-navigation/native";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

import { X } from "lucide-react-native";

import Reanimated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PapillonContextEnter,
  PapillonContextExit,
} from "@/utils/ui/animations";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { dateToEpochWeekNumber, weekNumberToDateRange } from "@/utils/epochWeekNumber";

LocaleConfig.locales["fr"] = {
  monthNames: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ],
  monthNamesShort: [
    "Janv.",
    "Févr.",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juil.",
    "Août",
    "Sept.",
    "Oct.",
    "Nov.",
    "Déc.",
  ],
  dayNames: [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ],
  dayNamesShort: ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."],
  today: "Aujourd'hui",
};

LocaleConfig.defaultLocale = "fr";

interface DateModalProps {
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => unknown;
  onDateSelect: (date: Date | undefined) => unknown;
  currentDate: Date;
  isHomework: boolean;
}

const DateModal: React.FC<DateModalProps> = ({
  showDatePicker,
  setShowDatePicker,
  onDateSelect,
  currentDate,
  isHomework,
}) => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  const weekRange = isHomework
    ? weekNumberToDateRange(dateToEpochWeekNumber(currentDate))
    : null;

  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    if (isHomework && weekRange) {
      const { start: startOfWeek, end: endOfWeek } = weekRange;
      let current = new Date(startOfWeek);
      current.setUTCDate(current.getUTCDate() - 1);

      while (current < endOfWeek) {
        const dateString = current.toISOString().split("T")[0];
        marks[dateString] = {
          selected: true,
          marked: true,
          selectedColor: colors.primary,
          selectedTextColor: "#fff",
        };
        current.setUTCDate(current.getUTCDate() + 1);
      }
    } else {
      const dateString = currentDate.toISOString().split("T")[0];
      marks[dateString] = {
        selected: true,
        disableTouchEvent: true,
        selectedDotColor: "orange",
        selectedColor: colors.primary,
        selectedTextColor: "#fff",
      };
    }

    return marks;
  }, [isHomework, weekRange, currentDate, colors]);

  return (
    <Modal transparent={true} visible={showDatePicker}>
      <Reanimated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          backgroundColor: "#00000099",
          paddingBottom: insets.bottom + 10,
        }}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable
          style={{
            width: "100%",
            flex: 1,
          }}
          onPress={() => setShowDatePicker(false)}
        />

        <Reanimated.View
          style={[
            {
              width: "90%",
              backgroundColor: colors.card,
              overflow: "hidden",
              borderRadius: 16,
              borderCurve: "continuous",
            },
          ]}
          entering={PapillonContextEnter}
          exiting={PapillonContextExit}
        >
          <View
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              paddingHorizontal: 18,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              gap: 2,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "medium",
                color: "#ffffff99",
              }}
            >
              Sélection de la date
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "semibold",
                color: "#fff",
              }}
            >
              {new Date(currentDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>

            <TouchableOpacity
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                backgroundColor: "#ffffff39",
                opacity: 0.7,
                padding: 6,
                borderRadius: 50,
              }}
              onPress={() => setShowDatePicker(false)}
            >
              <X size={20} strokeWidth={3} color="#fff" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={currentDate.toISOString().split("T")[0]}
            onDayPress={(day: { dateString: string | number | Date }) => {
              setShowDatePicker(false);
              const selectedDate = new Date(day.dateString);
              onDateSelect(selectedDate);
            }}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.text,
              dayTextColor: colors.text,
              todayTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: "#fff",
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              textDisabledColor: dark ? "#555" : "#ccc",
            }}
          />
        </Reanimated.View>
      </Reanimated.View>
    </Modal>
  );
};

export default DateModal;
