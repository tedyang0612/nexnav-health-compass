export type ConnectFacility = {
  id: number;
  name: string;
  specialty: string;
  distanceKm: number;
  area: string;
  symptoms: string[];
};

export const CONNECT_DEMO_FACILITIES: ConnectFacility[] = [
  { id: 1, name: "全O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 0.2, area: "南京復興站周邊", symptoms: ["頭痛", "頭暈", "耳鼻喉"] },
  { id: 2, name: "生O物理治療所", specialty: "物理治療", distanceKm: 0.4, area: "南京東路周邊", symptoms: ["腰痠", "肌肉", "關節", "姿勢"] },
  { id: 3, name: "心O身心科診所", specialty: "身心科", distanceKm: 0.5, area: "復興北路周邊", symptoms: ["疲倦", "精神", "睡眠", "壓力"] },
  { id: 4, name: "沛O復健科診所", specialty: "復健科", distanceKm: 0.6, area: "遼寧街周邊", symptoms: ["腰痠", "肌肉", "關節", "疼痛"] },
  { id: 5, name: "民O家庭醫學診所", specialty: "家庭醫學科", distanceKm: 0.9, area: "民生東路周邊", symptoms: ["頭痛", "頭暈", "疲倦", "腹部"] },
  { id: 6, name: "復O皮膚科診所", specialty: "皮膚科", distanceKm: 1.0, area: "復興南路周邊", symptoms: ["皮膚", "過敏"] },
  { id: 7, name: "榮O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 1.2, area: "長春路周邊", symptoms: ["頭痛", "頭暈", "耳鼻喉"] },
  { id: 8, name: "安O家庭醫學科診所", specialty: "家庭醫學科", distanceKm: 1.4, area: "八德路周邊", symptoms: ["頭痛", "疲倦", "腹部"] },
  { id: 9, name: "台O綜合醫院", specialty: "綜合醫院", distanceKm: 1.6, area: "敦化北路周邊", symptoms: ["頭痛", "頭暈", "腹部", "疼痛"] },
  { id: 10, name: "卓O物理治療所", specialty: "物理治療", distanceKm: 1.8, area: "敦化南路周邊", symptoms: ["腰痠", "肌肉", "關節", "姿勢"] },
  { id: 11, name: "森O肝膽腸胃科診所", specialty: "肝膽腸胃科", distanceKm: 2.0, area: "松江路周邊", symptoms: ["腹部", "腸胃", "噁心"] },
  { id: 12, name: "致O神經內科診所", specialty: "神經內科", distanceKm: 2.2, area: "忠孝東路周邊", symptoms: ["頭痛", "頭暈", "麻木"] },
  { id: 13, name: "親O家庭診所", specialty: "家庭醫學科", distanceKm: 2.5, area: "光復北路周邊", symptoms: ["頭痛", "疲倦", "腹部"] },
  { id: 14, name: "領O神經醫學診所", specialty: "神經內科", distanceKm: 2.8, area: "仁愛路周邊", symptoms: ["頭痛", "頭暈", "麻木"] },
  { id: 15, name: "民O復健診所", specialty: "復健科", distanceKm: 3.1, area: "民權東路周邊", symptoms: ["腰痠", "肌肉", "關節", "疼痛"] },
  { id: 16, name: "宜O肝膽腸胃科診所", specialty: "肝膽腸胃科", distanceKm: 3.4, area: "信義路周邊", symptoms: ["腹部", "腸胃", "噁心"] },
  { id: 17, name: "林O家庭醫學專科診所", specialty: "家庭醫學科", distanceKm: 3.7, area: "市民大道周邊", symptoms: ["頭痛", "疲倦", "腹部"] },
  { id: 18, name: "泰O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 4.0, area: "和平東路周邊", symptoms: ["頭痛", "頭暈", "耳鼻喉"] },
  { id: 19, name: "一O神經內科診所", specialty: "神經內科", distanceKm: 4.4, area: "中山北路周邊", symptoms: ["頭痛", "頭暈", "麻木"] },
  { id: 20, name: "康O復健科診所", specialty: "復健科", distanceKm: 4.8, area: "基隆路周邊", symptoms: ["腰痠", "肌肉", "關節", "疼痛"] },
];

export function connectSearchTarget(symptom: string) {
  if (/腰|肌肉|關節|痠|痛/.test(symptom) && !/頭/.test(symptom)) return "復健科 物理治療";
  if (/腹|腸胃|噁心/.test(symptom)) return "肝膽腸胃科 家庭醫學科";
  if (/疲倦|精神|睡眠|壓力/.test(symptom)) return "身心科 家庭醫學科";
  if (/頭痛|頭暈|麻木/.test(symptom)) return "神經內科 耳鼻喉科 家庭醫學科";
  return "家庭醫學科";
}
