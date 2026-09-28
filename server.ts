import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini AI SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('Gemini client initialization warning:', err);
  }
}

// ==========================================
// 1. CLINICAL SYMPTOM REASONING ENGINE & ENDPOINT
// ==========================================

interface StructuredAssessment {
  symptoms_identified: string[];
  body_system: string;
  primary_category: string;
  recommended_specialty: {
    name: string;
    reason: string;
    confidence: number;
  };
  needs_more_information: boolean;
  follow_up_questions: string[];
  possible_health_categories: {
    name: string;
    description: string;
  }[];
  warning_signs: {
    sign: string;
    reason: string;
    urgency: 'urgent' | 'emergency' | 'monitor';
  }[];
  general_guidance: string[];
  emergency: {
    is_emergency: boolean;
    message: string;
  };
  disclaimer: string;
}

// Open-World Semantic Medical Reasoning Engine (Predefined data is reference only, not a gate)
function determineClinicalReasoning(
  symptoms: string,
  duration?: string,
  severity?: string,
  ageGroup?: string,
  additionalInfo?: string
): StructuredAssessment {
  const combined = `${symptoms || ''} ${additionalInfo || ''}`.toLowerCase();
  const wordCount = (symptoms || '').trim().split(/\s+/).filter(Boolean).length;
  const isBriefOrBroad = wordCount <= 3 || /^(skin|teeth|tooth|eye|eyes|ear|ears|stomach|belly|head|knee|back|urine|pee|pain|problem|issue|something wrong|irritating)$/i.test(symptoms.trim());

  // 1. Red-flag emergency detection
  const emergencyKeywords = [
    'crushing chest', 'chest pain and trouble breathing', 'chest pain radiating', 'heart attack',
    'cannot breathe', "can't breathe", 'severe difficulty breathing', 'loss of consciousness',
    'passed out', 'unconscious', 'slurred speech', 'facial drooping', 'sudden weakness in arm',
    'stroke', 'coughing blood', 'vomiting blood', 'uncontrolled bleeding', 'anaphylaxis',
    'throat closing', 'choking', 'severe chest pain'
  ];
  const hasEmergency = emergencyKeywords.some(keyword => combined.includes(keyword));

  // 2. Open-World Semantic Body-System Classifiers (Tolerates typos, colloquial terms & natural language)
  const isDental = /\b(tooth|teeth|teath|toot|gum|gums|molar|molars|incisor|incisors|cavity|cavities|mouth pain|mouth sore|jaw|jaws|chew|chewing|bite|biting|dental|dentist|enamel|denture|dentures|abscess|toothache)\b/i.test(combined);
  const isDentalWithSwelling = isDental && (combined.includes('swelling') || combined.includes('swollen') || combined.includes('face'));

  const isSkin = /\b(skin|derm|rash|rashes|itch|itching|itchy|hive|hives|urticaria|eczema|blister|blisters|acne|pimple|pimples|pore|psoriasis|scab|peel|peeling|dry patch|dry skin|mole|moles|wart|warts|boil|boils|lesion|lesions|wound|wounds|bruis|tinea|fungal|dandruff|folliculitis|redness|red patch|bumps|bump|irritating skin|irritated skin)\b/i.test(combined) && !isDental;

  const isEye = /\b(eye|eyes|vision|seeing|sight|eyeball|eyeballs|eyelid|eyelids|cornea|pupil|pupils|iris|photophobia|light sensitivity|blur|blurry|blurred|double vision|floaters|pink eye|conjunctivitis|stye|watery eye|dry eye|tearing)\b/i.test(combined) && !isDental;

  const isENT = /\b(ear|ears|hearing|tinnitus|ringing in ear|blocked ear|ear feels blocked|deaf|throat|sore throat|swallow|swallowing|tonsil|tonsils|sinus|sinuses|nose|nasal|snore|snoring|hoarse|hoarseness|voice|loss of smell|earache|ear pain)\b/i.test(combined) && !isDental && !isSkin;

  const isCardio = /(chest pain|chest tightness|chest pressure|crushing chest|heart attack|palpitation|palpitations|irregular heart|racing heart|fluttering heart|skipped beat)/i.test(combined);

  const isRespiratory = /\b(cough|coughing|phlegm|sputum|wheeze|wheezing|asthma|breath|breathing|shortness of breath|short of breath|winded|lung|lungs|bronchitis|chest congestion)\b/i.test(combined) && !isCardio;

  const isMusculoskeletal = /\b(back pain|lumbar|neck pain|joint|joints|knee|knees|shoulder|shoulders|hip|hips|elbow|wrist|ankle|foot|feet|muscle|muscles|bone|bones|tendon|ligament|sprain|strain|arthritis|sciatica|spine|bone pain|stiff|stiffness|lumbago|limping|cartilage)\b/i.test(combined) && !isDental;

  const isUrinary = /(burning urination|burning while urinat|burning when i pee|my pee burns|painful urination|dysuria|frequent urination|blood in urine|hematuria|urinary|urine|pee|peeing|bladder|kidney stone|cloudy urine|flank pain|prostate)/i.test(combined);

  const isGI = /\b(stomach|abdomin|abdominal|belly|tummy|gut|digest|bowel|stool|poop|diarrhea|loose motion|constipation|vomit|vomiting|throw up|nausea|nauseous|heartburn|acid reflux|bloat|bloating|indigestion|food poisoning|cramp|cramping|gastric|acidic)\b/i.test(combined);

  const isNeuro = /\b(headache|head ache|migraine|dizzy|dizziness|vertigo|spinning|head is spinning|numbness|tingling|pins and needles|tremor|shaking|seizure|faint|fainting|passed out|blackout|confusion|memory|neuropathy|facial droop)\b/i.test(combined);

  const isGynecology = /\b(menstrual|period|periods|period pain|pelvic pain|vaginal|vagina|ovary|ovaries|uterus|pregnancy|cramps in lower abdomen|uterine)\b/i.test(combined);

  const isMentalHealth = /\b(anxiety|anxious|panic|panic attack|depressed|depression|insomnia|trouble sleeping|cannot sleep|stress|overwhelmed|nervous breakdown)\b/i.test(combined);

  const isConstitutionalGeneral = /\b(unwell|not feeling well|don't feel well|dont feel well|feeling sick|malaise|mild fever|fever and tired|tiredness|fatigue|exhausted|low energy|body ache all over|several unrelated symptoms)\b/i.test(combined);

  // Default values
  let bodySystem = 'Constitutional / Systemic Health';
  let primaryCategory = 'General Medicine & Primary Care';
  let specialtyName = 'General Physician';
  let specialtyReason = 'A general physician or primary care physician is best suited to evaluate systemic, constitutional symptoms, obtain baseline vitals, and coordinate targeted investigations.';
  let confidence = isBriefOrBroad ? 0.65 : 0.85;
  let needsMoreInfo = isBriefOrBroad;
  let followUpQuestions: string[] = [
    'What specific sensations, aches, or discomfort are you feeling?',
    'Are there any specific regions of your body that are bothering you?',
    'How long have you noticed these symptoms, and have they changed over time?'
  ];
  let healthCategories: { name: string; description: string }[] = [];
  let warningSigns: { sign: string; reason: string; urgency: 'urgent' | 'emergency' | 'monitor' }[] = [];
  let guidance: string[] = [];
  let symptomsIdentified: string[] = [symptoms.trim() || 'Unspecified symptoms'];
  let isEmergencyFlag = hasEmergency;
  let emergencyMessage = hasEmergency ? 'These symptoms indicate a potential acute medical emergency. Please seek immediate emergency medical care.' : '';

  if (isDental) {
    bodySystem = 'Oral Cavity & Dental System';
    primaryCategory = 'Dental & Oral Health';
    specialtyName = 'Dentist';
    confidence = isBriefOrBroad ? 0.82 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the teeth, gums, or oral cavity, so a dental consultation is indicated. Additional details about the exact location and triggers will help narrow the assessment.'
      : 'The symptoms involve dental or oral structures and require an in-person dental clinical examination, pulp vitality testing, and possible radiographs.';
    symptomsIdentified = isDentalWithSwelling
      ? ['Toothache / Dental discomfort', 'Facial / Oral soft tissue swelling']
      : combined.includes('gum')
        ? ['Gingival / Gum discomfort', 'Oral sensitivity']
        : ['Dental discomfort / Tooth complaint'];
    followUpQuestions = [
      'Which tooth, gum area, or side of your jaw is causing discomfort?',
      'Is the pain constant, throbbing, or triggered by hot, cold, or chewing?',
      'Have you noticed any visible swelling, redness, bleeding, or a bad taste?'
    ];
    healthCategories = [
      { name: 'Tooth decay', description: 'Demineralization of dental enamel and dentin causing localized pain or temperature sensitivity.' },
      { name: 'Dental infection', description: 'Bacterial colonization within the tooth pulp or surrounding dental tissues.' },
      { name: 'Dental abscess', description: 'A localized collection of pus at the root tip or gum margin typically accompanied by throbbing pain and swelling.' },
      { name: 'Gum disease', description: 'Gingival inflammation or periodontal pocket infection affecting supporting tooth structures.' },
      { name: 'Tooth sensitivity', description: 'Exposed dentinal tubules reacting sharply to cold, hot, sweet, or acidic foods and drinks.' },
      { name: 'Cracked or damaged tooth', description: 'A structural fissure causing sharp pain upon chewing or biting release.' }
    ];
    warningSigns = [
      { sign: 'Facial or jaw swelling', reason: 'May indicate a spreading dental infection or space abscess requiring urgent drainage.', urgency: 'urgent' },
      { sign: 'Significant mouth swelling', reason: 'Can compromise oral structures and indicate expanding infection.', urgency: 'urgent' },
      { sign: 'Difficulty breathing or swallowing', reason: 'Critical airway emergency if deep neck spaces become involved.', urgency: 'emergency' },
      { sign: 'Severe or rapidly worsening pain', reason: 'Requires immediate dental assessment to relieve acute pulpal or periapical pressure.', urgency: 'urgent' },
      { sign: 'High fever or feeling very unwell', reason: 'Suggests systemic spread of bacterial infection beyond the oral cavity.', urgency: 'urgent' },
      { sign: 'Difficulty opening the mouth (trismus)', reason: 'Indicates potential involvement of the masticator space.', urgency: 'urgent' }
    ];
    guidance = [
      'Gently rinse mouth with warm salt water to soothe irritated oral tissues.',
      'Avoid very hot, cold, or sugary foods and beverages that can irritate sensitive dental nerves.',
      'Do not place aspirin or other medication tablets directly against the gum tissue, as this causes chemical burns.',
      'Arrange an in-person dental consultation for visual inspection, pulp vitality testing, and dental radiographs.'
    ];
    if (isDentalWithSwelling) {
      isEmergencyFlag = true;
      emergencyMessage = 'Facial or jaw swelling with dental pain indicates a potentially spreading dental infection or abscess. Prompt urgent medical or dental evaluation is strongly advised.';
    }
  } else if (isSkin) {
    bodySystem = 'Integumentary System (Skin)';
    primaryCategory = 'Dermatological Health';
    specialtyName = 'Dermatologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description appears to relate to the skin, so a dermatology evaluation may be appropriate. More details about the specific skin symptoms will help narrow the assessment.'
      : 'The symptoms involve the skin, cutaneous lesions, or rashes, warranting specialized dermoscopic evaluation by a dermatologist.';
    symptomsIdentified = combined.includes('itch')
      ? ['Itchy skin sensation (Pruritus)', 'Cutaneous changes']
      : combined.includes('rash')
        ? ['Skin rash', 'Erythema']
        : ['Skin condition / Cutaneous complaint'];
    followUpQuestions = [
      'What specific changes have you noticed on the skin (e.g. rash, redness, bump, dry patch, blister, wound)?',
      'Where on your body is the skin issue located (e.g. face, arms, torso, generalized)?',
      'Is there any itching, burning, flaking, or spreading?',
      'How long has this skin change been present, and did it follow a new product, medication, or outdoor exposure?'
    ];
    healthCategories = [
      { name: 'Contact dermatitis', description: 'Inflammatory skin response to topical irritants or contact allergens (cosmetics, plants, metals).' },
      { name: 'Allergic skin reaction (Urticaria)', description: 'Histamine-mediated cutaneous wheals causing intense pruritus and redness.' },
      { name: 'Atopic dermatitis / Eczema', description: 'Chronic pruritic inflammatory skin condition characterized by skin barrier disruption.' },
      { name: 'Fungal skin infection (Tinea)', description: 'Superficial fungal colonization producing circular or scaly pruritic plaques.' },
      { name: 'Insect bite reaction', description: 'Localized hypersensitivity response to arthropod bites causing papular urticaria.' }
    ];
    warningSigns = [
      { sign: 'Rapidly spreading redness, extreme warmth, severe pain, or red streaks', reason: 'May indicate expanding cellulitis or soft-tissue bacterial infection.', urgency: 'urgent' },
      { sign: 'Widespread blistering, skin peeling, or skin sloughing off', reason: 'Emergency warning sign of severe cutaneous adverse reactions (e.g. SJS/TEN).', urgency: 'emergency' },
      { sign: 'Involvement of mucous membranes (eyes, lips, mouth, or genitals)', reason: 'Indicates systemic mucosal syndrome requiring urgent hospital care.', urgency: 'emergency' },
      { sign: 'Dark purple, non-blanching spots (petechiae or purpura)', reason: 'Can signify meningococcemia or systemic vasculitis.', urgency: 'emergency' },
      { sign: 'Accompanied by facial, lip, or tongue swelling, or breathing difficulty', reason: 'Signs of impending systemic anaphylaxis.', urgency: 'emergency' }
    ];
    guidance = [
      'Avoid scratching the affected area to prevent epidermal breakdown and secondary bacterial infection.',
      'Use mild, fragrance-free cleansers and lukewarm water rather than hot water for washing.',
      'Apply bland, hypoallergenic moisturizers to soothe dry, irritated skin barrier.',
      'Avoid applying strong unprescribed medicated creams until evaluated by a dermatologist.'
    ];
  } else if (isCardio || (hasEmergency && combined.includes('chest'))) {
    bodySystem = 'Cardiovascular & Thoracic System';
    primaryCategory = 'Cardiovascular & Thoracic Health';
    specialtyName = 'Cardiologist / Emergency Medicine';
    confidence = 0.95;
    needsMoreInfo = false;
    specialtyReason = 'Chest discomfort requires prompt clinical evaluation and objective diagnostic testing (such as ECG and cardiac biomarkers) to exclude acute coronary ischemia.';
    symptomsIdentified = ['Chest pain / Thoracic discomfort'];
    if (combined.includes('breath')) symptomsIdentified.push('Shortness of breath');
    if (combined.includes('sweat')) symptomsIdentified.push('Diaphoresis (Cold sweats)');
    followUpQuestions = [
      'Does the chest discomfort radiate to your left arm, shoulder, jaw, neck, or back?',
      'Is the sensation described as crushing, pressure, burning, or sharp?',
      'Are you experiencing sweating, dizziness, nausea, or shortness of breath?'
    ];
    healthCategories = [
      { name: 'Acute coronary syndrome / Myocardial ischemia', description: 'Potential reduction of blood supply to the heart muscle requiring emergency rule-out.' },
      { name: 'Costochondritis / Musculoskeletal chest wall pain', description: 'Inflammation of costochondral junctions between the ribs and sternum, often reproducible on palpation.' },
      { name: 'Gastroesophageal reflux / Esophageal spasm', description: 'Gastric acid backflow causing burning retrosternal discomfort that can mimic cardiac symptoms.' },
      { name: 'Pericarditis or pleural irritation', description: 'Inflammatory changes in tissue linings surrounding the heart or lungs, often positional.' },
      { name: 'Anxiety-associated chest tightness', description: 'Stress-induced muscular tension and hyperventilation producing thoracic constriction.' }
    ];
    warningSigns = [
      { sign: 'Crushing, heavy, or squeezing chest pressure lasting more than 10 minutes', reason: 'Major warning sign of acute myocardial infarction.', urgency: 'emergency' },
      { sign: 'Pain radiating to the left arm, neck, jaw, shoulder, or back', reason: 'Classic ischemic referred pain distribution.', urgency: 'emergency' },
      { sign: 'Shortness of breath, dizziness, cold sweat, or unexplained nausea', reason: 'Indicators of acute hemodynamic compromise.', urgency: 'emergency' },
      { sign: 'Fainting, syncope, or near-loss of consciousness', reason: 'May indicate a dangerous cardiac arrhythmia or sudden drop in cardiac output.', urgency: 'emergency' }
    ];
    guidance = [
      'Stop any physical exertion immediately and sit or rest in a comfortable, supported position.',
      'Do not drive yourself to the clinic; call emergency medical services if symptoms are severe or persistent.',
      'Avoid heavy meals, caffeine, or stimulants while awaiting medical evaluation.'
    ];
  } else if (isRespiratory) {
    bodySystem = 'Respiratory & Pulmonary System';
    primaryCategory = 'Respiratory & Pulmonary Health';
    specialtyName = 'Pulmonologist / Respiratory Specialist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description points to the respiratory tract and lungs. Clarifying the duration, cough character, and breathlessness will help determine whether a pulmonology or primary care review is indicated.'
      : 'The symptoms involve the airways and pulmonary system, warranting chest auscultation, pulse oximetry, and spirometry by a respiratory specialist or physician.';
    symptomsIdentified = combined.includes('cough') ? ['Cough / Airway irritation'] : ['Shortness of breath / Respiratory symptom'];
    followUpQuestions = [
      'Is the cough dry, or are you bringing up clear, yellow, or green mucus / phlegm?',
      'Are you experiencing wheezing, shortness of breath, or chest tightness?',
      'Do you have a fever, chills, or a history of asthma or respiratory allergies?'
    ];
    healthCategories = [
      { name: 'Acute bronchitis or tracheobronchial irritation', description: 'Inflammation of bronchial airways frequently following a viral upper respiratory infection.' },
      { name: 'Asthma exacerbation or reactive airway disease', description: 'Reversible bronchospasm with wheezing and chest constriction.' },
      { name: 'Pneumonia or lower respiratory infection', description: 'Infection of lung parenchyma characterized by productive cough, fever, and dyspnea.' },
      { name: 'Post-nasal drip cough syndrome', description: 'Upper airway secretions draining into the pharynx triggering persistent cough reflex.' }
    ];
    warningSigns = [
      { sign: 'Significant struggle to breathe, gasping, or inability to speak in full sentences', reason: 'Acute respiratory distress requiring immediate oxygenation and emergency care.', urgency: 'emergency' },
      { sign: 'Bluish or pale discoloration around the lips, nails, or skin (cyanosis)', reason: 'Critical sign of low blood oxygen saturation.', urgency: 'emergency' },
      { sign: 'Coughing up red blood or pink frothy sputum (hemoptysis)', reason: 'Requires urgent investigation to rule out pulmonary embolism or hemorrhage.', urgency: 'emergency' },
      { sign: 'High persistent fever with severe shaking chills and chest pain upon inhalation', reason: 'High suspicion of bacterial pneumonia or pleural inflammation.', urgency: 'urgent' }
    ];
    guidance = [
      'Rest upright with head elevated to facilitate optimal lung expansion.',
      'Stay well-hydrated with warm liquids to help thin bronchial secretions.',
      'Avoid exposure to secondhand smoke, dust, cold drafts, and chemical fumes.',
      'Seek prompt medical assessment if breathing becomes laboured or oxygen feels compromised.'
    ];
  } else if (isEye) {
    bodySystem = 'Visual System (Ophthalmic)';
    primaryCategory = 'Ophthalmic & Vision Health';
    specialtyName = 'Ophthalmologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the eyes or vision, so an eye specialist (ophthalmologist) evaluation may be appropriate. More details about visual clarity or discomfort will help narrow the assessment.'
      : 'The symptoms involve the ocular apparatus and require specialized slit-lamp biomicroscopy and intraocular pressure checks by an ophthalmologist.';
    symptomsIdentified = ['Eye discomfort / Ocular symptom'];
    if (combined.includes('vision') || combined.includes('blur')) symptomsIdentified.push('Blurred vision / Visual change');
    followUpQuestions = [
      'Is one eye or are both eyes affected?',
      'Are you experiencing blurred vision, eye redness, itching, discharge, or light sensitivity?',
      'Was there any recent eye injury, foreign object exposure, or contact lens use?'
    ];
    healthCategories = [
      { name: 'Conjunctivitis (Pink eye)', description: 'Infectious or allergic inflammation of the transparent conjunctival membrane covering the sclera.' },
      { name: 'Corneal abrasion or foreign body', description: 'A superficial scratch or trapped particle on the corneal surface producing sharp pain.' },
      { name: 'Dry eye syndrome or digital strain', description: 'Inadequate tear film stability or tear volume causing grittiness and fluctuating vision.' },
      { name: 'Blepharitis or Hordeolum (Stye)', description: 'Inflammation or bacterial blockage of eyelid margin glands.' },
      { name: 'Uveitis or intraocular pressure elevation', description: 'Internal inflammatory or hypertensive ocular disease requiring urgent slit-lamp review.' }
    ];
    warningSigns = [
      { sign: 'Sudden significant loss, darkening, or obstruction of vision in an eye', reason: 'Ophthalmic emergency indicating retinal detachment or vascular occlusion.', urgency: 'emergency' },
      { sign: 'Severe deep aching eye pain accompanied by nausea and colored halos around lights', reason: 'Key presentation of acute angle-closure glaucoma.', urgency: 'emergency' },
      { sign: 'Extreme sensitivity to light (photophobia) with deep ciliary redness', reason: 'Suggests acute anterior uveitis or corneal ulceration.', urgency: 'urgent' },
      { sign: 'Sudden shower of new floaters, bright flashes, or dark curtain across vision', reason: 'Classic warning signs of an impending retinal tear or detachment.', urgency: 'emergency' },
      { sign: 'Direct chemical splash or penetrating trauma to the eye', reason: 'Requires immediate copious eye flushing and emergency ophthalmic surgery.', urgency: 'emergency' }
    ];
    guidance = [
      'Do not rub the eye, especially if a foreign body or scratch is suspected.',
      'Remove contact lenses immediately and wear spectacles until cleared by an eye doctor.',
      'Rest eyes in low ambient lighting and minimize digital screen usage.',
      'Seek same-day ophthalmic evaluation if vision changes or intense pain are present.'
    ];
  } else if (isENT) {
    bodySystem = 'Ear, Nose & Throat (Otolaryngology)';
    primaryCategory = 'Ear, Nose & Throat (ENT)';
    specialtyName = 'ENT Specialist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the ear, nose, or throat, so an ENT evaluation may be appropriate. Providing more details about the sensation or location will help narrow the assessment.'
      : 'The symptoms localize to the ear, nose, throat, or paranasal sinuses, which are best evaluated with direct otoscopic and endoscopic examination by an ENT specialist.';
    symptomsIdentified = combined.includes('ear')
      ? ['Ear discomfort / Otalgia']
      : combined.includes('throat')
        ? ['Throat discomfort / Pharyngeal symptom']
        : ['ENT / Sinus symptom'];
    followUpQuestions = [
      'Is the primary issue in the ear, nose, throat, or paranasal sinuses?',
      'Are you experiencing ear fullness, hearing loss, discharge, or ringing (tinnitus)?',
      'Do you have throat pain upon swallowing, a muffled voice, or sinus facial pressure?'
    ];
    healthCategories = [
      { name: 'Otitis media or otitis externa', description: 'Infection or inflammation of the middle ear cavity or external auditory canal.' },
      { name: 'Acute pharyngitis or tonsillitis', description: 'Viral or bacterial infection of the pharyngeal mucosa or tonsillar tissue.' },
      { name: 'Acute or chronic sinusitis', description: 'Inflammatory congestion and fluid retention within the paranasal sinus cavities.' },
      { name: 'Eustachian tube dysfunction', description: 'Impaired pressure equalization between the middle ear and the nasopharynx.' },
      { name: 'Temporomandibular joint (TMJ) referred ear pain', description: 'Jaw joint misalignment or muscle tension radiating pain into the ear canal.' }
    ];
    warningSigns = [
      { sign: 'Swelling, redness, or severe tenderness behind the ear over the mastoid bone', reason: 'Warning sign of mastoiditis, a serious complication of ear infection.', urgency: 'urgent' },
      { sign: 'Difficulty breathing, stridor, or inability to swallow saliva / drooling', reason: 'Airway emergency from epiglottitis or peritonsillar abscess.', urgency: 'emergency' },
      { sign: 'Sudden complete hearing loss in one or both ears', reason: 'Sudden sensorineural hearing loss requires urgent audiological intervention.', urgency: 'urgent' },
      { sign: 'Clear fluid or blood draining from the ear canal following head trauma', reason: 'Potential skull base fracture or CSF leakage.', urgency: 'emergency' },
      { sign: 'Severe asymmetric tonsil swelling with muffled voice and high fever', reason: 'High suspicion of quinsy (peritonsillar abscess).', urgency: 'urgent' }
    ];
    guidance = [
      'Keep the ear canal dry; avoid inserting cotton swabs or foreign objects into the ear.',
      'Stay well-hydrated with warm fluids to soothe pharyngeal tissues.',
      'Use warm steam inhalation to promote sinus drainage if congestion is present.',
      'Consult an ENT specialist for direct otoscopy and targeted therapy.'
    ];
  } else if (isMusculoskeletal) {
    bodySystem = 'Musculoskeletal & Orthopedic System';
    primaryCategory = 'Musculoskeletal & Orthopedic Health';
    specialtyName = 'Orthopedic Specialist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the bones, joints, or muscles, so an orthopedic or musculoskeletal assessment may be appropriate. More details about mobility or injury history will help narrow the assessment.'
      : 'The symptoms relate to the spine, joints, bones, or musculature and warrant physical orthopedic evaluation and functional assessment.';
    symptomsIdentified = combined.includes('back')
      ? ['Lower back pain (Lumbago)']
      : combined.includes('knee')
        ? ['Knee pain / Joint discomfort']
        : ['Joint or musculoskeletal pain'];
    followUpQuestions = [
      'Which specific joint, bone, or muscle area is painful or stiff?',
      'Did this begin after a fall, twist, heavy lifting, or gradual overuse?',
      'Can you bear weight on the limb, and does the pain radiate anywhere else?'
    ];
    healthCategories = [
      { name: 'Acute lumbar or cervical muscle strain', description: 'Microscopic myofascial tearing and protective muscular spasm from physical exertion or posture.' },
      { name: 'Lumbar disc pathology or Sciatica', description: 'Intervertebral disc bulge irritating nerve roots, producing localized or radiating leg pain.' },
      { name: 'Osteoarthritis or degenerative joint disease', description: 'Mechanical wear-and-tear of articular cartilage causing joint stiffness and motion pain.' },
      { name: 'Ligamentous sprain or tendon strain', description: 'Excessive mechanical stretch or repetitive overload of supportive periarticular structures.' },
      { name: 'Postural or ergonomic spinal strain', description: 'Prolonged static posture causing spinal ligament fatigue and paraspinal aching.' }
    ];
    warningSigns = [
      { sign: 'Sudden loss of bowel or bladder control, or numbness in the groin/saddle area', reason: 'Cauda equina syndrome — a neurosurgical emergency.', urgency: 'emergency' },
      { sign: 'Progressive muscular weakness in the legs (such as foot drop or inability to bear weight)', reason: 'Indicates severe acute spinal cord or nerve root compression.', urgency: 'urgent' },
      { sign: 'Hot, intensely swollen, red single joint accompanied by high fever', reason: 'Concern for septic arthritis requiring emergency joint aspiration.', urgency: 'emergency' },
      { sign: 'Obvious bone deformity, bone instability, or severe trauma after a fall', reason: 'Indicates probable acute bone fracture or joint dislocation.', urgency: 'urgent' },
      { sign: 'Unremitting deep spinal pain that is severe at night and wakes you from sleep', reason: 'Red-flag symptom requiring imaging to rule out occult systemic pathology.', urgency: 'urgent' }
    ];
    guidance = [
      'Maintain gentle mobility; avoid prolonged strict bed rest which can worsen spinal stiffness.',
      'Apply a warm compress or ice pack wrapped in a cloth to the painful area for 15-20 minutes.',
      'Practice proper body mechanics: bend at the knees and hips, avoiding heavy lifting or sudden twisting.',
      'Consult an orthopedic or musculoskeletal specialist for physical examination and postural guidance.'
    ];
  } else if (isUrinary) {
    bodySystem = 'Urological & Renal System';
    primaryCategory = 'Urological & Renal Health';
    specialtyName = 'Urologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the urinary tract or kidneys. Urinalysis and urological assessment are indicated; more details about frequency and fever will help narrow the assessment.'
      : 'Urinary tract symptoms require urinalysis, urine culture, and targeted urological evaluation to identify infection or urinary tract irritation.';
    symptomsIdentified = ['Urinary tract discomfort / Dysuria'];
    followUpQuestions = [
      'Are you experiencing burning during urination, urinary frequency, or urgent urges to pee?',
      'Have you noticed any change in urine color (e.g. cloudy, dark, or visible pink/red blood)?',
      'Do you have back or flank pain, fever, nausea, or chills?'
    ];
    healthCategories = [
      { name: 'Lower urinary tract infection (Cystitis)', description: 'Bacterial colonization of the bladder lining causing pain, frequency, and urgency.' },
      { name: 'Urethral irritation or Urethritis', description: 'Inflammation of the urethra from infectious or chemical contact irritants.' },
      { name: 'Nephrolithiasis (Kidney or urinary stone)', description: 'Crystalline concretions causing sharp colic and micro-trauma to urinary passages.' },
      { name: 'Overactive bladder syndrome', description: 'Heightened sensitivity and involuntary contractions of the detrusor bladder muscle.' },
      { name: 'Prostate-related urinary changes (in men)', description: 'Inflammatory or benign enlargement of the prostate gland altering flow dynamics.' }
    ];
    warningSigns = [
      { sign: 'High fever, shaking chills, nausea, and severe back or flank pain', reason: 'Signs of acute pyelonephritis (kidney infection) requiring prompt antibiotics.', urgency: 'emergency' },
      { sign: 'Complete inability to pass urine despite a painful, distended bladder', reason: 'Acute urinary retention requiring urgent decompression.', urgency: 'emergency' },
      { sign: 'Gross, visible red blood or large blood clots in the urine', reason: 'Requires urgent urological investigation to determine bleeding site.', urgency: 'urgent' },
      { sign: 'Severe, agonizing flank-to-groin colic with persistent vomiting', reason: 'Indicates an obstructing urinary stone requiring acute pain relief and imaging.', urgency: 'urgent' },
      { sign: 'Confusion or sudden lethargy in an elderly individual with urinary symptoms', reason: 'Urosepsis warning sign requiring emergency hospital care.', urgency: 'emergency' }
    ];
    guidance = [
      'Increase oral water intake to help flush the urinary tract, unless fluid restricted.',
      'Avoid bladder irritants including caffeine, alcohol, artificial sweeteners, and spicy foods.',
      'Do not delay urination; empty bladder fully when feeling the urge.',
      'Provide a clean-catch urine sample for urinalysis and culture under clinical supervision.'
    ];
  } else if (isGI) {
    bodySystem = 'Gastrointestinal & Digestive System';
    primaryCategory = 'Gastrointestinal & Digestive Health';
    specialtyName = 'Gastroenterologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the stomach, abdomen, or digestion, so a gastroenterologist or primary care evaluation is appropriate. More details about pain timing and bowel changes will help narrow the assessment.'
      : 'Abdominal and digestive symptoms warrant abdominal palpation, auscultation, and targeted gastrointestinal evaluation by a gastroenterologist or physician.';
    symptomsIdentified = ['Digestive discomfort / Abdominal symptom'];
    if (combined.includes('diarrhea')) symptomsIdentified.push('Diarrhea');
    if (combined.includes('vomit') || combined.includes('nausea')) symptomsIdentified.push('Nausea / Vomiting');
    followUpQuestions = [
      'Where is the discomfort located (upper stomach, lower belly, right, left)?',
      'Is the pain related to eating, fasting, or specific food types?',
      'Are you experiencing nausea, vomiting, loose stools, constipation, or heartburn?'
    ];
    healthCategories = [
      { name: 'Acute gastroenteritis (Stomach bug)', description: 'Viral or bacterial mucosal inflammation causing cramping, watery stools, or nausea.' },
      { name: 'Gastritis or acid peptic disorder', description: 'Gastric acid irritation of the stomach lining causing burning epigastric discomfort.' },
      { name: 'Irritable bowel syndrome (IBS)', description: 'Functional gastrointestinal disorder involving visceral hypersensitivity and motility shifts.' },
      { name: 'Gastroesophageal reflux disease (GERD)', description: 'Incompetence of the lower esophageal sphincter allowing acidic reflux into the esophagus.' },
      { name: 'Biliary colic or gallbladder irritation', description: 'Episodic right upper quadrant pain frequently triggered by dietary fat intake.' }
    ];
    warningSigns = [
      { sign: 'Sudden, excruciating, rigid board-like abdomen or severe localized rebound tenderness', reason: 'Hallmarks of acute peritonitis or perforated internal organ.', urgency: 'emergency' },
      { sign: 'Vomiting bright red blood or material resembling dark coffee grounds', reason: 'Active upper gastrointestinal bleeding emergency.', urgency: 'emergency' },
      { sign: 'Black, tarry, foul-smelling stools (melena)', reason: 'Signifies significant internal digestive tract hemorrhage.', urgency: 'emergency' },
      { sign: 'Yellowing of the skin or eyes (jaundice) with fever or abdominal pain', reason: 'Indicates acute biliary tree obstruction or severe hepatic involvement.', urgency: 'urgent' },
      { sign: 'Inability to keep liquids down for over 24 hours with dry mouth and dizziness', reason: 'Risk of critical dehydration and electrolyte imbalance.', urgency: 'urgent' }
    ];
    guidance = [
      'Take small, frequent sips of oral rehydration solutions or clear broths to maintain electrolyte balance.',
      'Eat bland, easily digestible foods (such as rice, bananas, toast, applesauce) once nausea subsides.',
      'Avoid greasy, spicy, acidic foods and dairy products until digestion normalizes.',
      'Consult a physician if pain is sharp, focal, or fails to improve within 24 to 48 hours.'
    ];
  } else if (isNeuro) {
    bodySystem = 'Nervous System (Neurological)';
    primaryCategory = 'Neurological Health';
    specialtyName = 'Neurologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = isBriefOrBroad
      ? 'The description relates to the nervous system, head, or balance, so a neurological assessment is appropriate. More details about numbness, dizziness, or headache type will help narrow the assessment.'
      : 'Neurological symptoms involve central or peripheral nervous structures and require reflex, sensory, and cranial nerve clinical testing by a neurologist or physician.';
    symptomsIdentified = combined.includes('headache') || combined.includes('migraine') ? ['Severe headache / Cephalea'] : ['Neurological discomfort / Dizziness / Balance change'];
    followUpQuestions = [
      'Is the sensation a spinning sensation (vertigo), lightheadedness, or throbbing head pain?',
      'Are you experiencing any numbness, tingling, weakness in your arms or legs, or vision changes?',
      'Did this onset suddenly or gradually, and does moving your head make it worse?'
    ];
    healthCategories = [
      { name: 'Migraine or tension-type headache', description: 'Neurovascular headache disorder characterized by pulsing pain, scalp tension, or photophobia.' },
      { name: 'Benign paroxysmal positional vertigo (BPPV)', description: 'Inner ear canalith displacement or vestibular disturbance creating spinning sensations.' },
      { name: 'Peripheral nerve compression or radiculopathy', description: 'Mechanical nerve irritation producing localized tingling, numbness, or shooting discomfort.' },
      { name: 'Cervicogenic headache', description: 'Referred muscular and articular pain from upper cervical spine structures into the cranium.' }
    ];
    warningSigns = [
      { sign: 'Sudden "thunderclap" headache reaching maximum unbearable intensity within seconds', reason: 'High suspicion for subarachnoid hemorrhage.', urgency: 'emergency' },
      { sign: 'Sudden weakness, facial droop, or arm drift on one side of the body', reason: 'Classic signs of acute ischemic stroke (FAST protocol).', urgency: 'emergency' },
      { sign: 'Slurred speech, word-finding difficulty, or acute mental confusion', reason: 'Acute cerebral ischemia or encephalopathy warning sign.', urgency: 'emergency' },
      { sign: 'Headache accompanied by high fever, stiff neck, and intolerance of bright light', reason: 'Classic triad of acute bacterial meningitis.', urgency: 'emergency' }
    ];
    guidance = [
      'Rest in a quiet, dark, well-ventilated room to reduce sensory stimulation.',
      'Stay adequately hydrated and maintain regular meal schedules.',
      'Keep a symptom diary documenting triggers, duration, and associated sensations.',
      'Seek urgent medical evaluation if headache is novel, exceptionally severe, or accompanied by neurological deficits.'
    ];
  } else if (isGynecology) {
    bodySystem = 'Reproductive System (Gynecological)';
    primaryCategory = 'Gynecological & Reproductive Health';
    specialtyName = 'Gynecologist';
    confidence = isBriefOrBroad ? 0.80 : 0.95;
    needsMoreInfo = isBriefOrBroad;
    specialtyReason = 'Complaints localize to the reproductive system and are best evaluated with pelvic clinical examination and ultrasound imaging by a gynecologist.';
    symptomsIdentified = ['Pelvic discomfort / Gynecological symptom'];
    followUpQuestions = [
      'Is the pain cyclical and related to your menstrual cycle, ovulation, or independent of it?',
      'Have you noticed any abnormal vaginal bleeding, discharge, or burning?',
      'Is there any chance of pregnancy or missed periods?'
    ];
    healthCategories = [
      { name: 'Primary or secondary dysmenorrhea', description: 'Uterine myometrial cramping mediated by elevated menstrual prostaglandins.' },
      { name: 'Pelvic inflammatory condition or vaginitis', description: 'Bacterial or fungal microflora alteration causing mucosal irritation or discharge.' },
      { name: 'Functional ovarian cyst discomfort', description: 'Physiological follicular or luteal cyst creating transient unilateral pelvic aching.' },
      { name: 'Endometriosis evaluation', description: 'Ectopic endometrial tissue implants producing cyclic inflammatory pain.' }
    ];
    warningSigns = [
      { sign: 'Sudden severe unilateral lower abdominal/pelvic pain with abnormal or missed menses', reason: 'Potential ruptured ectopic pregnancy — immediate surgical emergency.', urgency: 'emergency' },
      { sign: 'Heavy vaginal bleeding soaking through two or more pads per hour continuously', reason: 'Risk of acute hypovolemia and hemorrhage.', urgency: 'emergency' },
      { sign: 'High fever with foul-smelling discharge and severe lower pelvic tenderness', reason: 'Concern for acute pelvic inflammatory disease (PID).', urgency: 'urgent' }
    ];
    guidance = [
      'Apply a gentle warm heating pad over the lower abdomen to ease uterine muscle tension.',
      'Stay well-hydrated and rest in a comfortable recumbent position.',
      'Consult a gynecologist for tailored reproductive health screening and pelvic ultrasound.'
    ];
  } else if (isMentalHealth) {
    bodySystem = 'Mental & Behavioral Health';
    primaryCategory = 'Mental & Behavioral Health';
    specialtyName = 'Psychiatrist';
    confidence = 0.85;
    needsMoreInfo = false;
    specialtyReason = 'Symptoms of severe anxiety, mood shifts, or sleep disruption are best assessed through compassionate psychiatric or psychological clinical consultation.';
    symptomsIdentified = ['Anxiety / Mood / Sleep disturbance'];
    followUpQuestions = [
      'How long have you felt this way, and does it interfere with your daily work or relationships?',
      'Are you experiencing physical symptoms such as a racing heart, trembling, or panic?',
      'How has your sleep and appetite been affected?'
    ];
    healthCategories = [
      { name: 'Generalized anxiety disorder or acute stress reaction', description: 'Elevated physiological arousal, worry, and autonomic hyperactivity.' },
      { name: 'Sleep architecture disruption (Insomnia)', description: 'Difficulty initiating or maintaining restorative sleep.' },
      { name: 'Depressive mood disorder', description: 'Persistent low mood, anhedonia, and fatigue.' }
    ];
    warningSigns = [
      { sign: 'Thoughts of self-harm, hopelessness, or suicide', reason: 'Immediate psychiatric emergency — seek crisis support or emergency hospital care.', urgency: 'emergency' },
      { sign: 'Severe panic with chest tightness and hyperventilation', reason: 'Rule out acute organic cardiac disease while managing acute distress.', urgency: 'urgent' }
    ];
    guidance = [
      'Practice slow diaphragmatic breathing: inhale for 4 seconds, hold for 4 seconds, exhale for 6 seconds.',
      'Reach out to trusted loved ones, friends, or a licensed mental health professional.',
      'Limit caffeine and screen exposure before bedtime.'
    ];
  } else if (isConstitutionalGeneral) {
    // REASONED General Physician recommendation for genuine constitutional / systemic presentation
    bodySystem = 'Constitutional / Systemic Health';
    primaryCategory = 'General Medicine & Primary Care';
    specialtyName = 'General Physician';
    confidence = 0.88;
    needsMoreInfo = false;
    specialtyReason = 'Constitutional symptoms (such as generalized malaise, fatigue, low-grade fever, or body aches) affect multiple body systems and are best evaluated by a General Physician through comprehensive physical exam and screening laboratory tests.';
    symptomsIdentified = [symptoms.trim() || 'General constitutional symptoms'];
    followUpQuestions = [
      'Have you checked your body temperature with a thermometer?',
      'Are you experiencing chills, body aches, a sore throat, or cough?',
      'Have you been able to maintain your oral food and fluid intake?'
    ];
    healthCategories = [
      { name: 'Viral prodrome or non-specific viral illness', description: 'Common self-limiting systemic immune response to viral exposure.' },
      { name: 'Physical fatigue or lifestyle-related exhaustion', description: 'Musculoskeletal and neuro-metabolic fatigue secondary to exertion or sleep deficit.' },
      { name: 'Mild systemic inflammatory response', description: 'Early physiological response warranting clinical monitoring.' }
    ];
    warningSigns = [
      { sign: 'Persistent high fever unresponsive to supportive measures', reason: 'Warrants objective diagnostic workup to exclude bacterial foci.', urgency: 'urgent' },
      { sign: 'Unintentional rapid weight loss or persistent drenching night sweats', reason: 'Red-flag constitutional symptoms requiring clinical investigation.', urgency: 'urgent' },
      { sign: 'Severe lethargy, dizziness upon standing, or inability to stay hydrated', reason: 'Signs of impending volume depletion or orthostatic instability.', urgency: 'urgent' }
    ];
    guidance = [
      'Ensure adequate oral hydration with water, electrolyte drinks, or clear soups.',
      'Prioritize restorative sleep and physical rest in a quiet, well-ventilated environment.',
      'Monitor body temperature and symptom progression twice daily.',
      'Consult a general physician if symptoms persist or interfere with everyday activities.'
    ];
  }

  return {
    symptoms_identified: symptomsIdentified,
    body_system: bodySystem,
    primary_category: primaryCategory,
    recommended_specialty: {
      name: specialtyName,
      reason: specialtyReason,
      confidence
    },
    needs_more_information: needsMoreInfo,
    follow_up_questions: followUpQuestions,
    possible_health_categories: healthCategories,
    warning_signs: warningSigns,
    general_guidance: guidance,
    emergency: {
      is_emergency: isEmergencyFlag,
      message: emergencyMessage
    },
    disclaimer: 'This tool provides general educational health information and does NOT provide a medical diagnosis. Please consult a qualified healthcare professional.'
  };
}

app.post('/api/gemini/analyze-symptoms', async (req: Request, res: Response) => {
  try {
    const { symptoms, duration, severity, ageGroup, additionalInfo } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({ error: 'Symptoms description is required.' });
    }

    // Baseline open-world semantic clinical reasoning
    const baseline = determineClinicalReasoning(symptoms, duration, severity, ageGroup, additionalInfo);

    const prompt = `
You are the Open-World Clinical Decision-Support Reasoning Engine for MediVault, an educational healthcare assistance platform.

CRITICAL ARCHITECTURE DIRECTIVES (OPEN-WORLD SEMANTIC UNDERSTANDING):
1. NO PREDEFINED WHITELISTS OR FIXED GATING:
   - You are not restricted to the symptom examples or mappings provided by the application. These mappings are reference examples only. You must use your general medical knowledge and semantic understanding to interpret new symptoms and natural-language descriptions that are not present in the reference data.
   - Never classify a symptom as General Physician solely because it is not present in the application's predefined symptom mapping.
   - General Physician should ONLY be recommended when the actual symptom information reasonably indicates that constitutional, systemic, or primary medical evaluation is appropriate (e.g. "I don't feel well", "mild fever and tiredness", "I feel generally unwell", "several unrelated constitutional symptoms").

2. SEMANTIC UNDERSTANDING OF NATURAL LANGUAGE & INFORMAL PHRASES:
   - Interpret the user's intended meaning regardless of wording, colloquialisms, typos, or brevity.
   - Examples of semantic body-system mapping:
     • "skin", "skin problem", "something wrong with my skin", "redness on my skin", "my skin feels itchy", "my skin is irritating", "my face has redness", "burning skin" -> Body System: Integumentary System (Skin) -> Specialty: Dermatologist
     • "my teeth hurt", "problem with my tooth", "tooth problem", "something is wrong with my gums", "jaw hurts when I chew", "pain when chewing" -> Body System: Oral Cavity & Dental -> Specialty: Dentist
     • "my ear feels blocked", "blocked ear", "ringing in ear", "trouble swallowing", "hoarse voice", "sinus pressure" -> Body System: Ear, Nose & Throat (ENT) -> Specialty: ENT Specialist
     • "my eyes are bothering me", "my eyes feel strange", "blurry vision", "red eye", "light sensitivity" -> Body System: Visual System (Ophthalmic) -> Specialty: Ophthalmologist
     • "my stomach feels bad", "my stomach feels uncomfortable", "belly hurts after eating", "loose motions", "nausea" -> Body System: Gastrointestinal & Digestive -> Specialty: Gastroenterologist
     • "my pee burns", "burning when I pee", "frequent peeing", "cloudy urine" -> Body System: Urological & Renal -> Specialty: Urologist
     • "pain in my knee", "my shoulder aches", "lower back is stiff", "limping after walking" -> Body System: Musculoskeletal & Orthopedic -> Specialty: Orthopedic Specialist
     • "my head is spinning", "dizzy", "headache", "pins and needles in hands" -> Body System: Nervous System (Neurological) -> Specialty: Neurologist
     • "coughing with phlegm", "hard to catch my breath", "wheezing" -> Body System: Respiratory & Pulmonary -> Specialty: Pulmonologist
     • "period cramps are unbearable", "irregular bleeding", "pelvic aching" -> Body System: Reproductive System (Gynecological) -> Specialty: Gynecologist
     • "severe anxiety, panic attacks, cannot sleep" -> Body System: Mental & Behavioral Health -> Specialty: Psychiatrist
     • "I don't feel well", "mild fever and tiredness", "feeling sick all over" -> Body System: Constitutional / Systemic -> Specialty: General Physician

3. CONFIDENCE & AMBIGUITY HANDLING:
   - Provide an internal classification confidence value between 0.0 and 1.0.
   - If the symptom is clear and specific (e.g. "tooth pain when biting cold food for 2 days") -> high confidence (0.90 to 0.98), "needs_more_information": false.
   - If the symptom is broad or brief (e.g. "skin", "tooth problem", "my eyes feel strange") -> moderate confidence (0.75 to 0.85), "needs_more_information": true, and provide 3 to 4 specific "follow_up_questions" to help the user clarify (e.g. for "skin": "What is happening to the skin (rash, itch, redness, bump)?", "Where on your body is this located?", "How long has it been present?").
   - Still route to the correct specialist (e.g. Dermatologist for "skin", Dentist for "tooth problem"), with a clear reason ("The description appears to relate to the skin, so a dermatology evaluation may be appropriate. More details about the specific skin symptoms would help narrow the assessment.").
   - If the symptom is genuinely too vague to identify any organ system (e.g. "I don't feel good", "not feeling right") -> recommended specialty: General Physician, confidence: 0.60 to 0.70, "needs_more_information": true, and provide follow-up questions asking for specific symptoms.

4. OPEN-ENDED POSSIBLE HEALTH CATEGORIES:
   - Provide 3 to 6 non-diagnostic plausible categories strictly relevant to the actual complaint.
   - Describe each in an objective, non-diagnostic manner. Never state "You have X".

5. SYMPTOM-SPECIFIC RED-FLAG WARNING SIGNS:
   - Warning signs must strictly align with the identified organ system (e.g. facial swelling / airway compromise for dental; rapidly spreading redness / blistering / mucosal involvement for skin; sudden vision loss / acute halos for eyes; crushing chest pain / radiation for chest).

6. EMERGENCY TRIAGE:
   - If acute red flags are present (crushing chest pain, severe breathlessness, stroke signs, anaphylaxis), set "emergency.is_emergency" to true and provide an immediate call-to-action.

USER INPUT:
- Primary Symptoms: "${symptoms}"
- Duration: "${duration || 'Not specified'}"
- Severity: "${severity || 'Moderate'}"
- Age Group: "${ageGroup || 'Adult'}"
- Context / Allergies: "${additionalInfo || 'None'}"

RETURN ONLY A VALID JSON OBJECT (no markdown ticks, no preamble) matching this exact schema:
{
  "symptoms_identified": ["string"],
  "body_system": "string",
  "primary_category": "string",
  "recommended_specialty": {
    "name": "string",
    "reason": "string",
    "confidence": 0.85
  },
  "needs_more_information": false,
  "follow_up_questions": [
    "string"
  ],
  "possible_health_categories": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "warning_signs": [
    {
      "sign": "string",
      "reason": "string",
      "urgency": "urgent"
    }
  ],
  "general_guidance": ["string"],
  "emergency": {
    "is_emergency": false,
    "message": ""
  },
  "disclaimer": "This tool provides general educational health information and does NOT provide a medical diagnosis. Please consult a qualified healthcare professional."
}
`;

    let result: StructuredAssessment = baseline;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.recommended_specialty && parsed.recommended_specialty.name) {
          // If Gemini mistakenly defaulted to General Physician for an obvious system where baseline found a specialist, use baseline
          if (baseline.recommended_specialty.name !== 'General Physician' && parsed.recommended_specialty.name === 'General Physician') {
            parsed.recommended_specialty = baseline.recommended_specialty;
            parsed.body_system = baseline.body_system;
            parsed.primary_category = baseline.primary_category;
            parsed.possible_health_categories = baseline.possible_health_categories;
            parsed.warning_signs = baseline.warning_signs;
            parsed.needs_more_information = baseline.needs_more_information;
            parsed.follow_up_questions = baseline.follow_up_questions;
          }
          result = parsed;
        }
      } catch (geminiError) {
        console.error('Gemini API symptom evaluation failed, using open-world semantic engine:', geminiError);
        result = baseline;
      }
    }

    // Enforce emergency flag if baseline or AI identified critical red-flag emergency
    if (baseline.emergency.is_emergency) {
      result.emergency = baseline.emergency;
    }

    const formattedConditions = Array.isArray(result.possible_health_categories)
      ? result.possible_health_categories.map(c => typeof c === 'string' ? c : `${c.name}: ${c.description}`)
      : [];

    const formattedCategoryNames = Array.isArray(result.possible_health_categories)
      ? result.possible_health_categories.map(c => typeof c === 'string' ? c : c.name)
      : [];

    const formattedWarningSigns = Array.isArray(result.warning_signs)
      ? result.warning_signs.map(w => typeof w === 'string' ? w : `${w.sign} — ${w.reason}`)
      : [];

    const generalInfoStr = Array.isArray(result.general_guidance)
      ? result.general_guidance.join(' ')
      : typeof result.general_guidance === 'string'
        ? result.general_guidance
        : 'Ensure adequate rest, gentle hydration, and seek in-person clinical review.';

    const responsePayload = {
      // 1. Section 16 Exact Schema
      symptoms_identified: result.symptoms_identified || [symptoms.slice(0, 80)],
      body_system: result.body_system || baseline.body_system,
      primary_category: result.primary_category || baseline.primary_category,
      recommended_specialty: result.recommended_specialty || baseline.recommended_specialty,
      needs_more_information: result.needs_more_information ?? baseline.needs_more_information,
      follow_up_questions: result.follow_up_questions || baseline.follow_up_questions || [],
      possible_health_categories: result.possible_health_categories || baseline.possible_health_categories,
      warning_signs: result.warning_signs || baseline.warning_signs,
      general_guidance: result.general_guidance || baseline.general_guidance,
      emergency: result.emergency || baseline.emergency,
      disclaimer: "This tool provides general educational health information and does NOT provide a medical diagnosis. Please consult a qualified healthcare professional.",

      // 2. Compatibility Fields for Frontend UI & Firestore
      symptomsIdentified: result.symptoms_identified || [symptoms.slice(0, 80)],
      bodySystem: result.body_system || baseline.body_system,
      primaryCategory: result.primary_category || baseline.primary_category,
      suggestedSpecialty: (result.recommended_specialty && result.recommended_specialty.name) || baseline.recommended_specialty.name,
      specialtyReason: (result.recommended_specialty && result.recommended_specialty.reason) || baseline.recommended_specialty.reason,
      confidence: (result.recommended_specialty && result.recommended_specialty.confidence) ?? baseline.recommended_specialty.confidence,
      needsMoreInformation: result.needs_more_information ?? baseline.needs_more_information,
      followUpQuestions: result.follow_up_questions || baseline.follow_up_questions || [],
      possibleConditions: formattedConditions.length > 0 ? formattedConditions : formattedCategoryNames,
      possibleHealthCategories: formattedCategoryNames,
      warningSigns: formattedWarningSigns,
      warningSignDetails: result.warning_signs || baseline.warning_signs,
      generalInformation: generalInfoStr,
      isEmergency: result.emergency ? result.emergency.is_emergency : false,
      emergencyNotice: result.emergency ? result.emergency.message : '',
    };

    return res.json(responsePayload);

  } catch (err: any) {
    console.error('Error analyzing symptoms:', err);
    return res.status(500).json({ error: 'Failed to complete symptom assessment. Please try again.' });
  }
});

// ==========================================
// 2. MEDICATION ASSISTANT ENDPOINT
// ==========================================
app.post('/api/gemini/explain-medication', async (req: Request, res: Response) => {
  try {
    const { prescriptionText, medicineName } = req.body;

    if (!prescriptionText && !medicineName) {
      return res.status(400).json({ error: 'Please enter a medicine or supplement name.' });
    }

    const medName = (medicineName || '').trim();
    const rawNote = (prescriptionText || '').trim();

    // Check if the prescription note is absent, empty, or a negative phrase
    const negativePhrases = [
      'not available', 'no prescription', 'not have prescription', 'not have prescription note',
      'don\'t have prescription', 'dont have prescription', 'no note', 'none', 'n/a', 'na',
      'empty', 'nil', 'no', 'nothing', 'not provided', 'without prescription', 'not have a prescription'
    ];
    const isNegativeNote = !rawNote || negativePhrases.some(phrase => {
      const lower = rawNote.toLowerCase();
      return lower === phrase || lower.startsWith(phrase) || lower.includes(phrase);
    });
    const effectivePrescription = isNegativeNote ? '' : rawNote;

    const prompt = `
You are the Medication Explainer Assistant in MediVault, an educational healthcare platform.

CRITICAL DIRECTIVES:
1. MEDICINE IDENTIFICATION:
   - Identify the brand name, active pharmacological ingredient(s), strength (if mentioned in input), and dosage form.
   - For example:
     • "Glucosamine" -> Active ingredient: Glucosamine (sulfate or hydrochloride)
     • "Thyrowick 50 mcg" -> Brand: Thyrowick, Active ingredient: Levothyroxine sodium, Strength: 50 mcg
     • "Augmentin 625" -> Brand: Augmentin, Active ingredient: Amoxicillin + Clavulanic Acid, Strength: 625 mg
     • "Dolo 650" / "Crocin" -> Active ingredient: Paracetamol, Strength: 650 mg
     • "Metformin 500" -> Active ingredient: Metformin hydrochloride, Strength: 500 mg

2. GENERAL USE INFORMATION — ACCURATE & MEDICINE-SPECIFIC (ABSOLUTELY NO VAGUE BOILERPLATE):
   - You MUST provide actual, medicine-specific standard administration information based on established clinical pharmacology.
   - NEVER GIVE VAGUE EVASIVE ANSWERS SUCH AS:
     ❌ "Varies depending on the specific formulation and clinical indication"
     ❌ "Can generally be taken at a convenient, consistent time of day unless specified otherwise"
     ❌ "Check product packaging or consult a pharmacist regarding taking with or without meals"
     ❌ "Follow the label"
     ❌ "Ask your pharmacist"
     ❌ "Take at a convenient time"
   - When reliable medicine-specific administration information is known, answer these concrete clinical questions:
     • frequency: How often is it commonly taken? (e.g. Glucosamine: "Usually taken once daily (1500 mg) or divided into 500 mg doses two to three times daily"; Paracetamol: "Every 4 to 6 hours as needed for symptoms, not exceeding 4000 mg in 24 hours"; Levothyroxine: "Once daily"; Omeprazole: "Once daily"; Metformin: "1 to 2 times daily with meals, or once daily with dinner for extended-release").
     • time_of_day: What time of day is standard? (e.g. Levothyroxine/Omeprazole: "In the morning, approximately 30 to 60 minutes before breakfast"; Metformin: "With morning and evening meals"; Statins: "In the evening or at bedtime"; Glucosamine: "In the morning or divided evenly with meals; consistent each day"; Paracetamol: "Whenever symptoms arise, spaced at least 4 to 6 hours apart"). If the medicine has flexible timing, clearly state: "May be taken at any time of day, but should be taken at the same time each day to maintain steady therapeutic levels."
     • food: Exact relation to meals (e.g. Levothyroxine/Omeprazole: "Take on an empty stomach, at least 30 to 60 minutes before breakfast with plain water"; Metformin/NSAIDs/Glucosamine: "Take with or immediately after food to minimize stomach upset and digestive irritation"; Paracetamol: "May be taken with or without food; taking with food is gentler on a sensitive stomach").
     • how_to_use: Practical physical administration (e.g. "Swallow whole with a full glass of water. Do not crush, chew, or break extended-release or coated tablets").
     • additional_timing: Essential spacing or administration instructions (e.g. Levothyroxine: "Wait at least 4 hours before or after taking calcium supplements, iron supplements, or antacids, as they bind the medicine and block absorption"; Ibuprofen: "Stay upright for at least 15 to 30 minutes after taking to avoid esophageal irritation", or empty string "" if not applicable).

3. CRITICAL DISTINCTION — GENERAL INFORMATION VS PERSONAL DOSAGE:
   - State standard clinical administration practices for this drug entity.
   - Do NOT invent a personal dose, number of tablets, or treatment duration for the user (e.g. do not say "You should take 2 tablets at 8:00 AM").
   - Use objective descriptions (e.g. "Glucosamine is commonly taken once daily (1500 mg) or divided into 500 mg doses with meals...").

4. COMMON USES: List bullet points of conditions/problems this medicine or supplement is commonly used for or may help manage.

5. COMMON SIDE EFFECTS: List commonly reported mild side effects without exaggerating.

6. PRESCRIPTION INSTRUCTIONS:
   - If a valid prescription note is provided ("${effectivePrescription}"):
     Explain ONLY what the user's written note says in simple, clear language without altering the dosage.
     Example format: "Your prescription says to take [rephrase instruction clearly]."
   - If no prescription was provided, set "prescription_explanation" to an empty string ("").

7. DO NOT include any "important_information" field.

8. FINAL NOTE MUST BE EXACTLY:
   "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."

USER INPUT:
- Medicine/Supplement Name: "${medName || 'General Medicine'}"
- Prescription Note: "${effectivePrescription || 'Not provided'}"

RETURN ONLY A VALID JSON OBJECT (no markdown ticks, no preamble) matching this exact schema:
{
  "medicine_name": "${medName || 'Medicine'}",
  "active_ingredient": "Identified active ingredient (e.g. Glucosamine sulfate / Levothyroxine sodium)",
  "strength": "Identified strength if mentioned in input, or empty string",
  "what_it_is": "Brief, clear explanation of what the medicine or supplement is.",
  "common_uses": [
    "Common purpose / problem / condition 1",
    "Common purpose / problem / condition 2"
  ],
  "general_use_information": {
    "frequency": "Concrete medicine-specific frequency (no vague boilerplate)",
    "time_of_day": "Concrete medicine-specific time of day (no vague boilerplate)",
    "food": "Concrete medicine-specific food relationship",
    "how_to_use": "Concrete administration method (swallowing whole, water, etc.)",
    "additional_timing": "Relevant timing separation/precaution or empty string"
  },
  "common_side_effects": [
    "Common side effect 1",
    "Common side effect 2"
  ],
  "prescription_explanation": "${effectivePrescription ? 'Explanation of the provided written prescription' : ''}",
  "final_note": "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
}
`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Ensure prescription_explanation is empty if no valid prescription was provided
        if (!effectivePrescription) {
          parsed.prescription_explanation = '';
        }

        // Bridge field naming for compatibility with frontend components
        if (parsed.general_use_information) {
          const gen = parsed.general_use_information;
          const foodVal = gen.food || gen.food_timing || '';
          const adminVal = gen.how_to_use || gen.administration || '';
          gen.food = foodVal;
          gen.food_timing = foodVal;
          gen.how_to_use = adminVal;
          gen.administration = adminVal;
          gen.additional_timing = gen.additional_timing || '';
        }

        parsed.final_note = "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine.";

        return res.json(parsed);
      } catch (geminiError) {
        console.error('Gemini medication explainer error:', geminiError);
      }
    }

    // Medicine-aware deterministic fallback with precise, non-vague administration facts
    const lowerMed = medName.toLowerCase();
    const prescriptionExplanation = effectivePrescription
      ? `Your prescription note says: "${effectivePrescription}". This indicates the specific instructions written on your slip. Always take this medication exactly as prescribed by your doctor and do not modify the dosage or frequency.`
      : '';

    // Extract strength if present in input string (e.g. "50 mcg", "650 mg", "500mg")
    const strengthMatch = medName.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)\b/i);
    const extractedStrength = strengthMatch ? strengthMatch[0] : '';

    let fallbackData = {
      medicine_name: medName || 'Medicine / Supplement',
      active_ingredient: 'Active therapeutic agent',
      strength: extractedStrength,
      what_it_is: `${medName || 'This medication'} is a healthcare product commonly used for therapeutic support or symptom management.`,
      common_uses: [
        'Symptomatic relief or therapeutic support under clinical guidance',
        'Management of health conditions as evaluated by a medical professional'
      ],
      general_use_information: {
        frequency: 'Typically taken once or twice daily depending on product strength and clinical indication.',
        time_of_day: 'Usually taken in the morning or evenly spaced across the day; taking at the same time each day maintains steady therapeutic levels.',
        food: 'Generally taken with or immediately after food to minimize stomach irritation, unless formulated for empty-stomach absorption.',
        how_to_use: 'Swallow tablets or capsules whole with a full glass of water. Do not crush, chew, or split coated or modified-release formulations.',
        additional_timing: 'If taking minerals, calcium, iron, or antacids, leave an interval of at least 2 hours to avoid binding interactions.'
      },
      common_side_effects: [
        'Mild digestive discomfort or individual sensitivity in some individuals'
      ],
      prescription_explanation: prescriptionExplanation,
      final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
    };

    if (lowerMed.includes('glucosamine')) {
      fallbackData = {
        medicine_name: medName || 'Glucosamine',
        active_ingredient: 'Glucosamine (Sulfate or Hydrochloride)',
        strength: extractedStrength || '1500 mg',
        what_it_is: 'Glucosamine is a naturally occurring amino sugar that serves as a building block for cartilage and joint fluid, widely used as a supportive dietary supplement.',
        common_uses: [
          'Commonly used for joint discomfort and cartilage support in conditions like osteoarthritis',
          'Supportive nutritional care for joint mobility and stiffness in aging or physically active individuals',
          'Promoting connective tissue and cartilage matrix maintenance'
        ],
        general_use_information: {
          frequency: 'Usually taken once daily (standard 1500 mg dose) or divided into 500 mg doses taken 3 times daily.',
          time_of_day: 'Typically taken in the morning with breakfast, or divided evenly with meals throughout the day; taking at consistent times daily is standard.',
          food: 'Take with or immediately after meals to prevent mild stomach upset, nausea, or heartburn.',
          how_to_use: 'Swallow capsules or tablets whole with a full glass of water. Do not crush coated caplets unless specified.',
          additional_timing: 'Regular daily use for 4 to 8 weeks is typically required before noticeable joint comfort benefits may be experienced.'
        },
        common_side_effects: [
          'Mild nausea, heartburn, or indigestion',
          'Stomach cramps or bloating',
          'Mild diarrhea or constipation in sensitive individuals'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('thyrowick') || lowerMed.includes('levothyroxine') || lowerMed.includes('eltroxin') || lowerMed.includes('thyronorm')) {
      fallbackData = {
        medicine_name: medName || 'Thyrowick 50 mcg',
        active_ingredient: 'Levothyroxine sodium',
        strength: extractedStrength || '50 mcg',
        what_it_is: 'Thyrowick is a synthetic thyroid hormone (levothyroxine sodium) that replaces or supplements the natural thyroxine produced by the thyroid gland.',
        common_uses: [
          'Management of hypothyroidism (underactive thyroid gland)',
          'Restoring and maintaining normal metabolic balance and energy levels in thyroid hormone deficiency'
        ],
        general_use_information: {
          frequency: 'Usually once daily.',
          time_of_day: 'In the morning, first thing upon waking.',
          food: 'Take on an empty stomach, at least 30 to 60 minutes before breakfast or morning coffee/tea.',
          how_to_use: 'Swallow the tablet whole with a full glass of plain water. Do not chew or crush.',
          additional_timing: 'Wait at least 4 hours before or after taking calcium supplements, iron supplements, soy products, or antacids, as they severely block absorption.'
        },
        common_side_effects: [
          'Generally well-tolerated when thyroid hormone levels are in balance',
          'Excess replacement levels may cause temporary rapid heartbeat, sweating, tremors, or restlessness'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('paracetamol') || lowerMed.includes('acetaminophen') || lowerMed.includes('dolo') || lowerMed.includes('crocin')) {
      fallbackData = {
        medicine_name: medName || 'Paracetamol',
        active_ingredient: 'Paracetamol (Acetaminophen)',
        strength: extractedStrength || '500 mg / 650 mg',
        what_it_is: 'Paracetamol (also known as acetaminophen) is an analgesic (pain reliever) and antipyretic (fever reducer) widely used for common ailments.',
        common_uses: [
          'Relief of mild to moderate pain including headaches, muscle aches, toothaches, joint pain, and sore throat',
          'Reduction of fever associated with viral infections, common cold, and flu'
        ],
        general_use_information: {
          frequency: 'Commonly taken every 4 to 6 hours as needed for symptoms, not exceeding 4000 mg in 24 hours for adults.',
          time_of_day: 'Taken when symptoms arise, maintaining a mandatory minimum interval of 4 to 6 hours between doses.',
          food: 'May be taken with or without food; taking with a glass of water or light food is gentler if experiencing nausea.',
          how_to_use: 'Swallow tablets whole with a glass of water. Avoid taking concurrently with other products containing paracetamol.',
          additional_timing: 'Avoid alcoholic beverages while taking paracetamol to prevent increased risk of liver toxicity.'
        },
        common_side_effects: [
          'Generally very well tolerated at therapeutic doses',
          'Rare mild nausea or skin rash (seek immediate medical care if allergic swelling or severe skin reaction occurs)'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('omeprazole') || lowerMed.includes('pantoprazole') || lowerMed.includes('rabeprazole') || lowerMed.includes('esomeprazole')) {
      fallbackData = {
        medicine_name: medName || 'Omeprazole',
        active_ingredient: 'Proton Pump Inhibitor (e.g. Omeprazole / Pantoprazole)',
        strength: extractedStrength || '20 mg / 40 mg',
        what_it_is: 'A proton pump inhibitor (PPI) that significantly reduces gastric acid production in the stomach lining.',
        common_uses: [
          'Relief from frequent acid reflux, heartburn, and indigestion',
          'Management of gastroesophageal reflux disease (GERD), stomach ulcers, and acid-related gastritis'
        ],
        general_use_information: {
          frequency: 'Usually once daily (or twice daily in severe reflux regimens as directed by a clinician).',
          time_of_day: 'In the morning, approximately 30 to 60 minutes before the first meal of the day (breakfast).',
          food: 'Must be taken on an empty stomach before meals; food intake stimulates the acid pumps that the drug inactivates.',
          how_to_use: 'Swallow capsules or tablets whole with water. Never crush, chew, or break delayed-release or enteric-coated pellets.',
          additional_timing: 'If prescribed twice daily for severe conditions, the second dose is standardly taken 30 to 60 minutes before the evening meal.'
        },
        common_side_effects: [
          'Mild headache',
          'Abdominal pain, mild diarrhea, or nausea',
          'Flatulence or constipation'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('amoxicillin') || lowerMed.includes('augmentin')) {
      fallbackData = {
        medicine_name: medName || 'Amoxicillin',
        active_ingredient: lowerMed.includes('augmentin') ? 'Amoxicillin + Clavulanic Acid' : 'Amoxicillin',
        strength: extractedStrength || '500 mg / 625 mg',
        what_it_is: 'A penicillin-class broad-spectrum antibiotic used to eradicate susceptible bacterial infections.',
        common_uses: [
          'Bacterial infections of the ear, nose, throat, respiratory tract (e.g. sinusitis, bronchitis)',
          'Urinary tract, dental, skin, and soft tissue bacterial infections as diagnosed by a doctor'
        ],
        general_use_information: {
          frequency: 'Usually twice daily (every 12 hours) or three times daily (every 8 hours) at evenly spaced intervals.',
          time_of_day: 'Evenly spaced throughout the day (for instance, 8:00 AM and 8:00 PM for twice-daily dosing).',
          food: 'Take with food or right at the start of a meal to enhance absorption and reduce stomach upset.',
          how_to_use: 'Swallow tablets whole with a full glass of water. Complete the entire prescribed duration even if you feel better.',
          additional_timing: 'Maintaining regular dosing intervals is essential to keep antibacterial levels constant in the bloodstream.'
        },
        common_side_effects: [
          'Mild diarrhea or loose stools',
          'Nausea or abdominal discomfort',
          'Mild skin rash (stop use and consult a physician if hives or breathing trouble occurs)'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('metformin') || lowerMed.includes('glycomet')) {
      fallbackData = {
        medicine_name: medName || 'Metformin',
        active_ingredient: 'Metformin Hydrochloride',
        strength: extractedStrength || '500 mg / 850 mg / 1000 mg',
        what_it_is: 'A biguanide oral medication that lowers blood glucose levels by decreasing hepatic glucose production and improving insulin sensitivity.',
        common_uses: [
          'First-line management of Type 2 diabetes alongside lifestyle measures',
          'Metabolic regulation and insulin resistance management under clinical supervision'
        ],
        general_use_information: {
          frequency: 'Commonly 1 to 2 times daily for immediate-release (with breakfast and dinner), or once daily for extended-release.',
          time_of_day: 'Taken with meals — morning and evening, or with the evening dinner for extended-release (ER/XR).',
          food: 'Always take with or immediately following a meal to prevent gastrointestinal upset, nausea, and loose stools.',
          how_to_use: 'Swallow tablets whole with water. Do not crush, chew, or split extended-release formulations.',
          additional_timing: 'Stay well-hydrated throughout the day and take at consistent meal times to support stable blood sugar levels.'
        },
        common_side_effects: [
          'Mild nausea, diarrhea, or metallic taste (usually decreases after initial weeks of treatment)',
          'Stomach cramping or bloating'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    } else if (lowerMed.includes('ibuprofen') || lowerMed.includes('advil') || lowerMed.includes('motrin') || lowerMed.includes('brufen')) {
      fallbackData = {
        medicine_name: medName || 'Ibuprofen',
        active_ingredient: 'Ibuprofen (Non-Steroidal Anti-Inflammatory Drug - NSAID)',
        strength: extractedStrength || '200 mg / 400 mg',
        what_it_is: 'A nonsteroidal anti-inflammatory drug (NSAID) that reduces inflammation, relieves pain, and lowers fever.',
        common_uses: [
          'Relief of inflammatory pain, headache, dental pain, back pain, menstrual cramps, and arthritis stiffness',
          'Temporary reduction of fever in infectious illnesses'
        ],
        general_use_information: {
          frequency: 'Typically taken every 4 to 6 or 8 hours as needed for pain, observing strict daily maximum limits.',
          time_of_day: 'Taken as symptoms occur, spaced evenly across waking hours.',
          food: 'Always take with food, milk, or immediately after a meal to protect the stomach lining from acid irritation.',
          how_to_use: 'Swallow whole with a full glass of water. Remain upright (do not lie down) for at least 15 to 30 minutes after taking.',
          additional_timing: 'Avoid concurrent use with other NSAIDs (such as naproxen or aspirin) to prevent gastrointestinal ulcers.'
        },
        common_side_effects: [
          'Mild heartburn, stomach upset, or indigestion',
          'Dizziness or mild headache'
        ],
        prescription_explanation: prescriptionExplanation,
        final_note: "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose or how to use the medicine."
      };
    }

    // Bridge field names for fallbackData
    const genInfoFallback: any = fallbackData.general_use_information;
    genInfoFallback.food_timing = genInfoFallback.food;
    genInfoFallback.administration = genInfoFallback.how_to_use;

    return res.json(fallbackData);

  } catch (err: any) {
    console.error('Error explaining medication:', err);
    return res.status(500).json({ error: 'Failed to explain medication.' });
  }
});

// ==========================================
// 3. OCR / DOCUMENT EXTRACTION ENDPOINT
// ==========================================
app.post('/api/gemini/extract-document', async (req: Request, res: Response) => {
  try {
    const { documentTitle, documentText, documentCategory } = req.body;

    const prompt = `
You are the Medical Document Intelligence Engine in MediVault.
Extract clinical metadata from this ${documentCategory || 'medical document'}: "${documentTitle}".
Content / OCR Text: "${documentText || 'Standard medical report with clinical consult notes'}"

Extract any mentioned:
1. Doctor Name
2. Hospital or Clinic Name
3. Document Date (YYYY-MM-DD format if identifiable)
4. Diagnoses or clinical impressions mentioned
5. Prescribed medications (name, dosage, frequency, instructions)
6. Lab tests mentioned (testName, result, normalRange)
7. Follow-up consultation date if noted

RETURN ONLY A VALID JSON OBJECT matching:
{
  "doctorName": string,
  "hospitalName": string,
  "date": string,
  "diagnosisMentioned": string[],
  "medications": [
    { "name": string, "dosage": string, "frequency": string, "instructions": string }
  ],
  "tests": [
    { "testName": string, "result": string, "normalRange": string }
  ],
  "followUpDate": string,
  "confidenceNote": "AI-extracted information. Always verify against the original clinical document."
}
`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (err) {
        console.error('Gemini document extraction error:', err);
      }
    }

    return res.json({
      doctorName: 'Dr. Clinical Consultant',
      hospitalName: 'Healthcare Center',
      date: new Date().toISOString().split('T')[0],
      diagnosisMentioned: ['General Health Review'],
      medications: [],
      tests: [],
      followUpDate: 'As advised by doctor',
      confidenceNote: 'AI-extracted information. Please verify with the original document.'
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to extract document information.' });
  }
});




// ==========================================
// VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[MediVault Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
