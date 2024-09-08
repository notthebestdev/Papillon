import {useTheme} from "@react-navigation/native";
import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {Dimensions, Platform, ScrollView, Switch, Text, View} from "react-native";
import {Screen} from "@/router/helpers/types";
import {toggleHomeworkState, updateHomeworkForWeekInCache} from "@/services/homework";
import {useHomeworkStore} from "@/stores/homework";
import {useCurrentAccount} from "@/stores/account";
import {HeaderCalendar} from "./HomeworksHeader";
import HomeworkItem from "./Atoms/Item";
import {RefreshControl} from "react-native-gesture-handler";
import HomeworksNoHomeworksItem from "./Atoms/NoHomeworks";
import {Homework} from "@/services/shared/Homework";
import {NativeItem, NativeList, NativeListHeader, NativeText} from "@/components/Global/NativeComponents";
import {Account} from "@/stores/account/types";
import {debounce} from "lodash";
import {dateToEpochWeekNumber, epochWNToDate} from "@/utils/epochWeekNumber";
import InfinitePager from "react-native-infinite-pager";
import BottomSheet from "@/components/Modals/PapillonBottomSheet";
import {ChevronLeft, Cog, Eye, CalendarIcon} from "lucide-react-native";
import {PressableScale} from "react-native-pressable-scale";
import Reanimated, {useSharedValue, withSpring} from "react-native-reanimated";
import {Calendar} from "react-native-calendars";
import {CalendarList} from "react-native-calendars/src";
import {MarkedDates} from "react-native-calendars/src/types";


// Types pour les props du composant HomeworkList
type HomeworkListProps = {
  groupedHomework: Record<string, Homework[]>;
  loading: boolean;
  onDonePressHandler: (homework: Homework) => void;
  showCheckedHomeworks: boolean;
};

const formatDate = (date: string | number | Date): string => {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long"
  });
};

const HomeworkList: React.FC<HomeworkListProps> = React.memo(({ groupedHomework, loading, onDonePressHandler, showCheckedHomeworks }) => {
  if (!loading && Object.keys(groupedHomework).length === 0) {
    return <HomeworksNoHomeworksItem />;
  }

  return (
    <>
      {Object.keys(groupedHomework).map((day, index) => (
        <View key={index}>
          <NativeListHeader label={day} />
          <NativeList>
            {groupedHomework[day].map((homework, idx) => (
              <View key={homework.id}>
                {(showCheckedHomeworks ? true:!homework.done) &&
                    <HomeworkItem
                      index={idx}
                      total={groupedHomework[day].length}
                      homework={homework}
                      onDonePressHandler={async () => onDonePressHandler(homework)}
                    />
                }
              </View>
            ))}
          </NativeList>
        </View>
      ))}
    </>
  );
}, (prevProps, nextProps) => prevProps.groupedHomework === nextProps.groupedHomework && prevProps.loading === nextProps.loading);

// Types pour les props du composant HomeworksPage
type HomeworksPageProps = {
  index: number;
  isActive: boolean;
  loaded: boolean;
  homeworks: Record<number, Homework[]>;
  account: Account;
  updateHomeworks: () => Promise<void>;
  loading: boolean;
  getDayName: (date: string | number | Date) => string;
  showCheckedHomeworks: boolean;
};

const HomeworksPage: React.FC<HomeworksPageProps> = React.memo(({ index, loaded, homeworks, account, updateHomeworks, loading, getDayName, showCheckedHomeworks }) => {
  const [refreshing, setRefreshing] = useState(false);
  if (!loaded) {
    return <ScrollView
      style={{ flex: 1, padding: 16, paddingTop: 0 }}
    >

      <View style={{padding: 32}}>
        <Text style={{color: "white", fontSize: 16, textAlign: "center"}}>
          {index}
        </Text>
      </View>
    </ScrollView>;
  }

  const homeworksInWeek = homeworks[index] ?? [];
  const sortedHomework = useMemo(
    () => homeworksInWeek.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime()),
    [homeworksInWeek]
  );

  const groupedHomework = useMemo(
    () =>
      sortedHomework.reduce((acc, curr) => {
        const dayName = getDayName(curr.due);
        const formattedDate = formatDate(curr.due);
        const day = `${dayName} ${formattedDate}`;

        if (!acc[day]) {
          acc[day] = [curr];
        } else {
          acc[day].push(curr);
        }

        return acc;
      }, {} as Record<string, Homework[]>),
    [sortedHomework]
  );

  const handleDonePress = useCallback(
    async (homework: Homework) => {
      await toggleHomeworkState(account, homework);
      await updateHomeworks();
    },
    [account, updateHomeworks]
  );

  const refreshAction = useCallback(async () => {
    setRefreshing(true);
    await updateHomeworks();
    setRefreshing(false);
  }, [updateHomeworks]);

  return (
    <ScrollView
      style={{ flex: 1, padding: 16, paddingTop: 0 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAction}
        />
      }
    >
      <HomeworkList
        groupedHomework={groupedHomework}
        loading={loading}
        onDonePressHandler={handleDonePress}
        showCheckedHomeworks={showCheckedHomeworks}
      />

    </ScrollView>
  );
}, (prevProps, nextProps) => {
  return prevProps.index === nextProps.index;
});

const initialIndex = dateToEpochWeekNumber(new Date());

const HomeworksScreen: Screen<"Homeworks"> = ({ navigation }) => {
  const theme = useTheme();
  const account = useCurrentAccount(store => store.account!);
  const homeworks = useHomeworkStore(store => store.homeworks);

  // NOTE: PagerRef is a pain to type, please help me...
  const PagerRef = useRef<any>(null);

  const [epochWeekNumber, setEpochWeekNumber] = useState<number>(initialIndex);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCheckedHomeworks, setShowCheckedHomeworks] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState({});

  //Animation value
  const translateX = useSharedValue(0);

  useEffect(() => {
    console.log("[Homeworks]: account instance changed");
    if (account.instance) {
      manuallyChangeWeek(initialIndex);
    }
  }, [account.instance]);

  const manuallyChangeWeek = (index: number) => {
    setEpochWeekNumber(index);
    PagerRef.current?.setPage(index);
  };

  const MemoizedHeaderCalendar = useMemo(
    () => (
      <HeaderCalendar
        epochWeekNumber={epochWeekNumber}
        oldPageIndex={epochWeekNumber}
        showPicker={() => {
          setShowDatePicker(true);
        }}
        changeIndex={(index: number) => manuallyChangeWeek(index)}
      />
    ),
    [epochWeekNumber, manuallyChangeWeek]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => MemoizedHeaderCalendar,
    });
  }, [navigation, epochWeekNumber]);

  const updateHomeworks = useCallback(async () => {
    setLoading(true);
    console.log("[Homeworks]: updating cache...",epochWeekNumber, epochWNToDate(epochWeekNumber));
    await updateHomeworkForWeekInCache(account, epochWNToDate(epochWeekNumber));
    console.log("[Homeworks]: updated cache !", epochWNToDate(epochWeekNumber));
    setLoading(false);
  }, [account, epochWeekNumber]);

  const debouncedUpdateHomeworks = useMemo(() => debounce(updateHomeworks, 500), [updateHomeworks]);

  const getDayName = (date: string | number | Date): string => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[new Date(date).getDay()];
  };

  useEffect(() => {
    debouncedUpdateHomeworks();
  }, [navigation, account.instance, epochWeekNumber]);

  useEffect(() => {
    let date = epochWNToDate(epochWeekNumber);
    date.setDate(date.getDate() - date.getDay() + 1);
    let selected: MarkedDates = {};
    for (let i = 0; i < 7; i++) {
      let date_string: string = date.toISOString().split("T")[0];
      selected[date_string] = {

        customStyles: {
          container: {
            backfaceVisibility: "visible",
            backgroundColor: theme.colors.primary + "20",
            borderTopLeftRadius: i === 0 ? 100 : 0,
            borderTopRightRadius: i === 6 ? 100 : 0,
            borderBottomLeftRadius: i === 0 ? 100 : 0,
            borderBottomRightRadius: i === 6 ? 100 : 0,
            width: "100%",
          },
          text: {
            color: theme.colors.primary
          }
        }
      };
      date.setDate(date.getDate() + 1);
    }
    setSelectedWeek(selected);
  }, [epochWeekNumber]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <BottomSheet
        setOpened={setShowDatePicker}
        opened={showDatePicker}
      >
        <Reanimated.View style={{display: "flex", flexDirection: "row", transform: [{translateX: translateX}]}}>
          <View style={{width: Dimensions.get("screen").width}}>
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.text + "20",
              display: "flex",
              flexDirection: "row",
              gap: 10,
              alignItems: "center"
            }}>
              <CalendarIcon size={24} color={theme.colors.text}/>
              <View>
                <NativeText variant={"overtitle"}>
                  Sélection de la semaine
                </NativeText>
                <NativeText variant={"subtitle"}>
                  {epochWNToDate(epochWeekNumber).toLocaleDateString("fr-FR", {}) + " - " + epochWNToDate(epochWeekNumber + 1).toLocaleDateString("fr-FR", {})}
                </NativeText>
              </View>
              <PressableScale onPress={() => {
                translateX.value = withSpring(-Dimensions.get("screen").width, {
                  damping: 98,
                  stiffness: 200
                });
              }} style={{marginLeft: "auto"}}>
                <Cog size={24} color={"#999"}/>
              </PressableScale>
            </View>
            <View style={{}}>
              <CalendarList
                horizontal={true}
                pagingEnabled={true}
                calendarWidth={Dimensions.get("screen").width}
                staticHeader={true}
                markingType={"custom"}
                markedDates={selectedWeek}
                onDayPress={(day) => {
                  setEpochWeekNumber(dateToEpochWeekNumber(new Date(day.dateString)));
                  setShowDatePicker(true);
                }}
                initialDate={epochWNToDate(epochWeekNumber)}
                firstDay={1}
                theme={{
                  backgroundColor: theme.colors.primary,
                  calendarBackground: theme.colors.background,
                  textSectionTitleColor: theme.colors.text,
                  textSectionTitleDisabledColor: theme.colors.text + "80",
                  selectedDayBackgroundColor: theme.colors.primary,
                  selectedDayTextColor: "#FFF",
                  todayTextColor: theme.colors.primary,
                  dayTextColor: theme.colors.text,
                  textDisabledColor: theme.colors.text + "80",
                  arrowColor: theme.colors.primary,
                  disabledArrowColor: theme.colors.text + "80",
                  monthTextColor: theme.colors.text,
                  textDayFontFamily: "regular",
                  textMonthFontFamily: "semibold",
                  textDayHeaderFontFamily: "light",
                  textDayFontSize: 16,
                  textMonthFontSize: 17,
                  textDayHeaderFontSize: 15
                }}
              />
            </View>
          </View>
          <View style={{width: Dimensions.get("screen").width}}>
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.text + "20",
              display: "flex",
              flexDirection: "row",
              gap: 10,
              alignItems: "center"
            }}>
              <PressableScale onPress={() => {
                translateX.value = withSpring(0, {
                  damping: 98,
                  stiffness: 200
                });
              }}>
                <ChevronLeft size={24} color={"#999"}/>
              </PressableScale>
              <View>
                <NativeText variant={"overtitle"}>
                  Paramètres des devoirs
                </NativeText>
                <NativeText variant={"subtitle"}>
                  Régle ici les paramètres des devoirs
                </NativeText>
              </View>
            </View>
            <ScrollView contentContainerStyle={{paddingHorizontal: 16}}>
              <NativeList>
                <NativeItem
                  leading={<Eye color={theme.colors.text} size={24}/> }
                  trailing={
                    <Switch
                      trackColor={{true: theme.colors.primary, false: "#EEE"}}
                      value={showCheckedHomeworks}
                      onValueChange={setShowCheckedHomeworks}
                    />
                  }
                >
                  <NativeText variant={"default"}>
                    Afficher les devoirs terminés
                  </NativeText>
                  <NativeText variant={"subtitle"}>
                    Affiche ou non les devoirs que tu as marqué comme terminés
                  </NativeText>
                </NativeItem>
              </NativeList>
            </ScrollView>
          </View>
        </Reanimated.View>
      </BottomSheet>
      {account.instance && (
        <InfinitePager
          ref={PagerRef}
          initialIndex={initialIndex}
          pageBuffer={3}
          PageComponent={
            ({index}) => (<View style={{height: "100%"}}>
              <HomeworksPage
                key={index}
                index={index}
                isActive={true}
                loaded={true}
                homeworks={homeworks}
                account={account}
                updateHomeworks={updateHomeworks}
                loading={loading}
                getDayName={getDayName}
                showCheckedHomeworks={showCheckedHomeworks}
              />
            </View>
            )}
          style={{ flex: 1}}
          onPageChange={setEpochWeekNumber}
        />
      )}
    </View>
  );
};

export default HomeworksScreen;
