do $$
declare
  v_codes text[] := array[
    'headache','dizziness','fatigue','sleep_difficulty',
    'abdominal_gastrointestinal_discomfort','muscle_joint_discomfort',
    'nose_throat_discomfort','other'
  ];
begin
  if (select count(*) from public.symptom_catalog where code = any(v_codes) and is_active = true) <> 8 then
    raise exception 'Pre-check failed: not all 8 symptom codes exist and are active';
  end if;
  if exists (select 1 from public.guide_templates where symptom_code = any(v_codes) and (is_active = true or template_version = '1.0')) then
    raise exception 'Pre-check failed: existing active or v1.0 template found';
  end if;
end $$;

insert into public.guide_templates (symptom_code, template_code, template_version, is_active, content, suggestions, sources) values
(
  'headache','guide_headache','1.0',true,
  jsonb_build_object(
    'title','改善方向｜頭痛',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','頭痛可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('水分攝取不足、用餐時間不規律','睡眠不足或作息改變','壓力、長時間專注或肌肉緊繃','咖啡因攝取量突然改變'),
    'factors_disclaimer','這些是一般常見因素，不能單憑紀錄判定實際原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('頭痛發生的時間與持續多久','是否與睡眠、飲食、壓力或特定活動接近','頭痛位置、感受或發生頻率是否改變','是否出現原本沒有的新症狀'),
    'escalation','如果症狀突然明顯加重、出現新的安全警訊，或已持續影響日常生活，應重新進行狀況確認或尋求專業醫療評估。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','hydrate_regular_meals','title','補充水分並保持規律飲食','description','觀察補充水分及避免長時間空腹後，頭痛是否有所變化。'),
    jsonb_build_object('code','short_rest_relaxation','title','安排短暫休息與放鬆','description','長時間使用螢幕或專注工作時，可暫停活動、舒展身體，讓眼睛與肩頸休息。'),
    jsonb_build_object('code','regular_sleep_schedule','title','維持相對規律的睡眠時間','description','記錄睡眠不足、晚睡或作息改變後，頭痛是否更容易出現。')
  ),
  jsonb_build_array(
    jsonb_build_object('title','NHS｜Headaches','url','https://www.nhs.uk/symptoms/headaches/'),
    jsonb_build_object('title','NHS｜Tension headaches','url','https://www.nhs.uk/conditions/tension-headaches/')
  )
),
(
  'dizziness','guide_dizziness','1.0',true,
  jsonb_build_object(
    'title','改善方向｜頭暈或不穩感',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','頭暈或不穩感可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('水分攝取不足或較長時間沒有進食','從坐姿或躺姿快速起身','睡眠不足、疲勞或壓力','酒精、咖啡因或部分藥物的影響'),
    'factors_disclaimer','這些是一般常見因素，不能單憑紀錄判定實際原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('發生時正在站立、走動、轉頭或改變姿勢','每次持續多久，休息後是否緩解','是否伴隨噁心、耳鳴、頭痛或視覺變化','睡眠、飲食、水分與發生時間的關係'),
    'escalation','若症狀突然明顯加重、出現新的安全警訊，或已影響行走與日常活動，應重新進行狀況確認或尋求專業醫療評估。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','slow_position_changes','title','放慢起身與移動速度','description','從躺姿或坐姿起身時分段進行，先確認身體穩定再開始走動。'),
    jsonb_build_object('code','hydrate_regular_meals','title','補充水分並維持規律飲食','description','避免長時間沒有進食，並觀察飲水或用餐後是否有所變化。'),
    jsonb_build_object('code','rest_avoid_hazards','title','先休息並避免危險活動','description','頭暈發生時先坐下或躺下休息，暫時避免駕駛、登高或操作危險設備。')
  ),
  jsonb_build_array(jsonb_build_object('title','NHS｜Dizziness','url','https://www.nhs.uk/symptoms/dizziness/'))
),
(
  'fatigue','guide_fatigue','1.0',true,
  jsonb_build_object(
    'title','改善方向｜疲倦或精神不濟',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','疲倦或精神不濟可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('睡眠時間不足或睡眠品質不佳','飲食不規律、水分不足','活動量過少或近期活動負荷增加','壓力、情緒或生活作息改變'),
    'factors_disclaimer','持續且無法透過休息改善的疲倦，也可能需要進一步評估，不能只歸因於生活習慣。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('疲倦最明顯的時間','睡眠後是否能恢復精神','是否影響專注、工作或一般活動','是否伴隨體重、食慾、情緒或其他身體變化'),
    'escalation','若疲倦持續數週、逐漸加重、休息後仍未改善，或明顯影響日常生活，建議尋求專業醫療評估。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','fixed_sleep_wake_times','title','維持固定的睡眠與起床時間','description','先從每天相近時間起床開始，觀察精神狀態是否逐漸穩定。'),
    jsonb_build_object('code','regular_meals_hydration','title','安排規律飲食與水分補充','description','避免長時間空腹，並記錄用餐與精神變化之間的關係。'),
    jsonb_build_object('code','light_activity','title','依目前狀態安排輕度活動','description','可嘗試短時間步行或伸展，避免在明顯不適時勉強增加強度。')
  ),
  jsonb_build_array(jsonb_build_object('title','NHS｜Tiredness and fatigue','url','https://www.nhs.uk/symptoms/tiredness-and-fatigue/'))
),
(
  'sleep_difficulty','guide_sleep_difficulty','1.0',true,
  jsonb_build_object(
    'title','改善方向｜睡眠困擾',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','睡眠困擾可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('就寢與起床時間不固定','睡前使用手機、工作或進行刺激性活動','下午或晚間攝取咖啡因','壓力、環境光線、噪音或溫度'),
    'factors_disclaimer','睡眠問題也可能受到身體或心理狀況影響，不能只憑一項生活紀錄判定原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('上床、入睡與起床的大致時間','夜間醒來次數與清醒時間','早晨醒來後的精神狀態','咖啡因、運動、午睡與睡眠之間的關係'),
    'escalation','若睡眠困擾持續數月、生活調整後仍未改善，或已明顯影響白天功能，建議尋求專業評估。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','consistent_sleep_schedule','title','維持相近的就寢與起床時間','description','每天盡量在固定時間起床，避免因前一晚睡不好而大幅改變作息。'),
    jsonb_build_object('code','wind_down_routine','title','睡前安排放鬆過渡時間','description','睡前降低光線與活動刺激，暫停工作或手機使用，安排較平靜的活動。'),
    jsonb_build_object('code','caffeine_environment_check','title','留意咖啡因與睡眠環境','description','觀察下午或晚間咖啡因攝取，以及房間光線、噪音和溫度是否影響睡眠。')
  ),
  jsonb_build_array(
    jsonb_build_object('title','NHS｜Insomnia','url','https://www.nhs.uk/conditions/insomnia/'),
    jsonb_build_object('title','NHS｜Sleep problems','url','https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/')
  )
),
(
  'abdominal_gastrointestinal_discomfort','guide_abdominal_gastrointestinal_discomfort','1.0',true,
  jsonb_build_object(
    'title','改善方向｜腹部或腸胃不適',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','腹部或腸胃不適可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('用餐時間、份量或進食速度改變','特定食物、飲料或酒精','水分不足或排便習慣改變','壓力與生活作息變化'),
    'factors_disclaimer','腸胃症狀的原因很多，不能只依食物或壓力紀錄判定實際原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('不適位置、感受與持續時間','是否發生在用餐前後','排便次數、型態或顏色是否改變','是否伴隨噁心、嘔吐、發燒或食慾變化'),
    'escalation','若疼痛突然劇烈、觸碰腹部明顯疼痛、出現血便或黑便、持續嘔吐，或症狀快速惡化，應儘速尋求醫療協助。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','slow_smaller_meals','title','放慢進食速度並避免一次吃得過多','description','可先選擇較容易接受的份量，觀察餐後不適是否有所變化。'),
    jsonb_build_object('code','food_symptom_log','title','記錄飲食與不適發生時間','description','記下餐點、飲料與症狀出現的時間，不必立即自行刪除多類食物。'),
    jsonb_build_object('code','hydrate_regular_routine','title','補充水分並維持規律作息','description','觀察飲水、排便及睡眠變化是否與不適同時出現。')
  ),
  jsonb_build_array(
    jsonb_build_object('title','NHS｜Stomach ache','url','https://www.nhs.uk/symptoms/stomach-ache/'),
    jsonb_build_object('title','NHS｜Digestive health','url','https://www.nhs.uk/live-well/eat-well/digestive-health/five-lifestyle-tips-for-a-healthy-tummy/')
  )
),
(
  'muscle_joint_discomfort','guide_muscle_joint_discomfort','1.0',true,
  jsonb_build_object(
    'title','改善方向｜肌肉或關節不適',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','肌肉或關節不適可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('近期活動量、運動方式或工作姿勢改變','重複動作或長時間維持相同姿勢','過度使用、輕微拉扯或休息不足','原有的肌肉或關節問題'),
    'factors_disclaimer','不能只依疼痛位置或活動紀錄判定實際原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('不適的部位與範圍','是否有腫脹、發熱、僵硬或活動受限','哪些動作會加重或減輕不適','是否與受傷、運動或重複動作有時間關係'),
    'escalation','若關節明顯紅腫發熱、受傷後無法承重、出現麻木或感覺異常，或疼痛持續惡化，應尋求專業醫療評估。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','adjust_aggravating_activity','title','暫時調整造成不適的活動','description','降低會明顯加重不適的動作或強度，但不必完全停止所有活動。'),
    jsonb_build_object('code','gentle_movement_posture_changes','title','安排溫和活動與姿勢變換','description','依可接受範圍輕柔活動，並避免長時間維持相同姿勢。'),
    jsonb_build_object('code','activity_response_log','title','記錄活動負荷與身體反應','description','觀察特定運動、工作姿勢或休息後，不適程度如何變化。')
  ),
  jsonb_build_array(
    jsonb_build_object('title','NHS｜Joint pain','url','https://www.nhs.uk/symptoms/joint-pain/'),
    jsonb_build_object('title','NHS｜Ways to ease pain','url','https://www.nhs.uk/live-well/pain/10-ways-to-ease-pain/')
  )
),
(
  'nose_throat_discomfort','guide_nose_throat_discomfort','1.0',true,
  jsonb_build_object(
    'title','改善方向｜鼻子或喉嚨不適',
    'summary_disclaimer','以下內容根據你目前的紀錄整理，提供一般性的生活調整與觀察方向，不代表診斷結果。',
    'factors_title','可能相關的日常因素',
    'factors_intro','鼻子或喉嚨不適可能和多種因素同時出現，例如：',
    'factors', jsonb_build_array('感冒等常見感染','過敏原、空氣污染或菸煙','空氣乾燥或水分攝取不足','長時間說話、咳嗽或清喉嚨'),
    'factors_disclaimer','這些是一般常見因素，不能只憑症狀判定是感染、過敏或其他原因。',
    'suggestion_note','不必一次執行全部建議，可以先選擇一項嘗試，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('主要是鼻塞、流鼻水、喉嚨痛或其他感受','是否伴隨咳嗽、發燒或吞嚥不適','是否在特定環境或時段加重','症狀持續時間及變化方向'),
    'escalation','若出現呼吸或吞嚥困難、症狀快速加重、明顯脫水，或喉嚨不適超過一週仍未改善，應尋求醫療協助。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','hydrate_and_rest','title','補充水分並安排休息','description','觀察充分休息及飲水後，鼻子或喉嚨的不適是否有所變化。'),
    jsonb_build_object('code','reduce_irritant_exposure','title','減少菸煙與刺激性環境暴露','description','暫時避開吸菸區、強烈氣味或其他會明顯加重不適的環境。'),
    jsonb_build_object('code','gentle_nose_throat_care','title','依主要不適進行溫和照護','description','喉嚨不適可嘗試溫鹽水漱口；鼻部不適可使用適當的生理食鹽水產品。')
  ),
  jsonb_build_array(
    jsonb_build_object('title','NHS｜Sore throat','url','https://www.nhs.uk/symptoms/sore-throat/'),
    jsonb_build_object('title','NHS｜Common cold','url','https://www.nhs.uk/conditions/common-cold/')
  )
),
(
  'other','guide_other','1.0',true,
  jsonb_build_object(
    'title','改善方向｜其他不適',
    'summary_disclaimer','由於這項不適不在目前的分類中，系統不會自行推測原因或提供特定症狀建議。',
    'factors_title','一般健康資訊',
    'factors_intro','不同的不適可能有許多原因，僅憑使用者輸入的名稱、困擾程度或生活紀錄，無法安全判斷可能因素。',
    'factors', jsonb_build_array('不推測疾病或原因','不提供特定治療方式','不提供用藥建議','不顯示未經核准的症狀對應內容'),
    'factors_disclaimer','以下僅提供通用的紀錄與觀察方式，不是針對此項不適的治療建議。',
    'suggestion_note','可以選擇適合目前情況的紀錄方式，並透過每日追蹤觀察變化。',
    'observations', jsonb_build_array('不適的具體位置與感受','每次持續多久、多久發生一次','哪些情境會加重或減輕','是否出現新的相關症狀','是否逐漸影響日常活動'),
    'escalation','若不適持續、反覆發生、逐漸加重，或無法確定適合的處理方式，建議查看就醫與專業支持方向。'
  ),
  jsonb_build_array(
    jsonb_build_object('code','record_context','title','記錄不適發生的情境','description','記下發生時間、正在進行的活動，以及發生前的飲食、睡眠或其他變化。'),
    jsonb_build_object('code','observe_changes','title','觀察不適的變化方式','description','記錄位置、感受、持續時間及程度是否改變。'),
    jsonb_build_object('code','avoid_clear_aggravators','title','避免明顯會加重不適的活動','description','若已發現某項活動會穩定加重症狀，可暫時調整並持續觀察。')
  ),
  '[]'::jsonb
);

do $$
declare
  v_total int;
begin
  select count(*) into v_total from public.guide_templates where template_version = '1.0' and is_active = true;
  if v_total <> 8 then
    raise exception 'Post-check failed: expected 8 active v1.0 templates, found %', v_total;
  end if;
  if exists (
    select 1 from public.guide_templates
    where template_version = '1.0'
      and (jsonb_array_length(suggestions) <> 3 or content ? 'sources')
  ) then
    raise exception 'Post-check failed: suggestions count or content sources key invalid';
  end if;
  if exists (
    select symptom_code from public.guide_templates where is_active = true
    group by symptom_code having count(*) <> 1
  ) then
    raise exception 'Post-check failed: symptom has more than one active template';
  end if;
end $$;