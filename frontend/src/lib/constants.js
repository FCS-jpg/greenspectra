export const DISEASE_META = {
  healthy: {
    label: 'Healthy Crop',
    color: '#22c55e',
    emoji: '✅',
    urgency: null,
  },
  powdery_mildew: {
    label: 'Powdery Mildew',
    color: '#f59e0b',
    emoji: '🍄',
    urgency: 'Act within 3 days',
  },
  leaf_blight: {
    label: 'Leaf Blight',
    color: '#ef4444',
    emoji: '🍂',
    urgency: 'Immediate action required',
  },
  rust: {
    label: 'Crop Rust',
    color: '#b45309',
    emoji: '🟤',
    urgency: 'Act within 1 week',
  },
}

export const DISEASE_DETAIL = {
  healthy: {
    whatIsThis: [
      'No fungal, bacterial, or viral infection detected',
      'Leaf structure and pigmentation within normal parameters',
      'Maintain current irrigation and fertilization schedule',
    ],
    recoverySignals: {
      positive: [
        'Consistent deep green color throughout all leaves',
        'No spots, lesions, or powdery residue visible',
        'Strong upright leaf posture and firm stems',
        'New growth appears healthy and uniform',
      ],
      negative: [
        'Any new discoloration, spots, or streaking',
        'Unusual wilting or drooping in cool conditions',
        'Sticky residue or visible pest presence',
        'Distorted or stunted new growth',
      ],
    },
    economicImpact: { loss: '0%', risk: 'None', cost: 'Minimal', timeToAct: 'N/A' },
    preventionTips: [
      { icon: '💧', title: 'Water Management', tip: 'Water at the base of plants — avoid wetting foliage to prevent fungal growth' },
      { icon: '🌬️', title: 'Air Circulation', tip: 'Maintain proper plant spacing to allow airflow between rows' },
      { icon: '🌱', title: 'Crop Rotation', tip: 'Rotate crop families every season to prevent soil pathogen buildup' },
    ],
    timeline: {
      phases: [
        { phase: 'Weekly', action: 'Visual inspection of all plants for early signs' },
        { phase: 'Monthly', action: 'Full crop survey and record-keeping' },
        { phase: 'Seasonal', action: 'Preventive fungicide application before wet season' },
        { phase: 'Annual', action: 'Soil health and nutrient profile analysis' },
      ],
    },
  },
  leaf_blight: {
    whatIsThis: [
      'Fungal infection caused by Alternaria or Helminthosporium species',
      'Spreads rapidly via water splash, wind, and infected tools',
      'Can destroy 20–40% of yield within days if left untreated',
    ],
    recoverySignals: {
      positive: [
        'New leaf growth emerges without dark spots or lesions',
        'Existing lesions stop expanding and begin to dry out',
        'Overall leaf color stabilizing back toward green',
        'No new tissue collapse or necrotic areas forming',
      ],
      negative: [
        'Lesions spreading rapidly to new and healthy leaves',
        'Yellowing or wilting accelerating across the canopy',
        'Defoliation increasing — leaves dropping prematurely',
        'Stems or developing fruit showing blight symptoms',
      ],
    },
    economicImpact: { loss: '20–40%', risk: 'High', cost: '$180–320/acre', timeToAct: '< 24 hrs' },
    preventionTips: [
      { icon: '🔄', title: 'Crop Rotation', tip: 'Never replant the same crop family in blight-affected soil consecutively' },
      { icon: '💧', title: 'Drip Irrigation', tip: 'Switch to drip irrigation — overhead watering spreads spores via splash' },
      { icon: '🌿', title: 'Remove Debris', tip: 'Destroy (do not compost) all infected plant material at season end' },
    ],
    timeline: {
      phases: [
        { phase: 'Today', action: 'Apply copper-based fungicide, isolate affected area immediately' },
        { phase: 'Day 3', action: 'Inspect full field for spread, second application if needed' },
        { phase: 'Week 2', action: 'Remove infected plant material, third application cycle' },
        { phase: 'Week 4', action: 'Recovery assessment — evaluate new growth for clear tissue' },
      ],
    },
  },
  powdery_mildew: {
    whatIsThis: [
      'White fungal growth (Erysiphales order) colonizing leaf surfaces',
      'Thrives in high humidity with poor airflow between plants',
      'Reduces photosynthesis capacity and progressively weakens the crop',
    ],
    recoverySignals: {
      positive: [
        'White powdery coating visibly thinning on affected leaves',
        'New leaf growth emerging free of powdery residue',
        'Plant regaining normal coloration in untreated areas',
        'Leaf curl and distortion gradually reversing',
      ],
      negative: [
        'Powder spreading to stems, petioles, and developing fruit',
        'Leaves yellowing and dropping from the canopy early',
        'Severe defoliation leaving bare stems exposed',
        'Fruit quality declining — russeting or cracking visible',
      ],
    },
    economicImpact: { loss: '10–20%', risk: 'Moderate', cost: '$80–150/acre', timeToAct: '3 days' },
    preventionTips: [
      { icon: '🌬️', title: 'Air Circulation', tip: 'Prune densely growing branches — mildew thrives in stagnant humid air' },
      { icon: '🧪', title: 'Preventive Sprays', tip: 'Apply potassium bicarbonate solution at the start of humid seasons' },
      { icon: '🌞', title: 'Light Exposure', tip: 'Ensure canopy receives adequate sunlight — UV exposure suppresses spore germination' },
    ],
    timeline: {
      phases: [
        { phase: 'Days 1–3', action: 'Apply sulfur-based or systemic fungicide to all affected tissue' },
        { phase: 'Week 1', action: 'Monitor treatment response, improve canopy air circulation' },
        { phase: 'Week 3', action: 'Second fungicide application — rotate to prevent resistance' },
        { phase: 'Week 6', action: 'Full recovery assessment and season-end review' },
      ],
    },
  },
  rust: {
    whatIsThis: [
      'Spore-forming fungal disease caused by Puccinia species',
      'Spreads aggressively via airborne urediniospores carried by wind',
      'Responsible for yield losses of 10–70% in severe regional outbreaks',
    ],
    recoverySignals: {
      positive: [
        'Orange/brown pustules drying out and no longer releasing spores',
        'No new pustule formation appearing on healthy tissue',
        'Green leaf area holding steady — no further chlorosis spreading',
        'New growth emerging rust-free above infected zones',
      ],
      negative: [
        'Pustules spreading rapidly to new leaves and upper canopy',
        'Orange spore clouds visible when foliage is disturbed',
        'Premature leaf fall accelerating across the field',
        'Heads, grain, or fruiting bodies showing rust symptoms',
      ],
    },
    economicImpact: { loss: '10–70%', risk: 'High', cost: '$120–250/acre', timeToAct: '1 week' },
    preventionTips: [
      { icon: '🌱', title: 'Resistant Varieties', tip: 'Select rust-resistant cultivars certified for your region in the next planting cycle' },
      { icon: '📅', title: 'Early Planting', tip: 'Plant early in the season to escape peak rust humidity windows' },
      { icon: '🧪', title: 'Triazole Fungicides', tip: 'Propiconazole or tebuconazole as a preventive spray before rust season' },
    ],
    timeline: {
      phases: [
        { phase: 'Days 1–7', action: 'Scout full field extent, apply triazole fungicide immediately' },
        { phase: 'Week 2', action: 'Reassess coverage — re-apply if incidence exceeds 10% of canopy' },
        { phase: 'Week 4', action: 'Monitor for new pustule formation on upper leaves' },
        { phase: 'Week 8', action: 'Post-season assessment and resistant variety planning' },
      ],
    },
  },
}
