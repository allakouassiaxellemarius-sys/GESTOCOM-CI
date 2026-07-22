export const PLAN_COMPTABLE_OHADA = {
  '1': {
    classe: '1', nom: 'CAPITAUX PROPRES, AUTRES FONDS PROPRES ET PROVISIONS',
    comptes: {
      '10': { libelle: 'Fonds associatifs (sans contrepartie)', sub: {
        '101': 'Fonds associatifs sans droit de reprise', '104': 'Dons et subventions', '106': 'Réserves', '107': 'Report à nouveau',
      }},
      '11': { libelle: 'Réserves', sub: { '112': 'Réserves légales', '113': 'Réserves facultatives', '118': 'Autres réserves' }},
      '12': { libelle: 'Report à nouveau', sub: { '120': 'Report à nouveau bénéficiaire', '128': 'Report à nouveau débiteur' }},
      '13': { libelle: 'Résultat de l\'exercice', sub: { '130': 'Résultat bénéficiaire', '131': 'Résultat débiteur' }},
      '15': { libelle: 'Provisions pour charges', sub: { '151': 'Provisions pour risques', '152': 'Provisions pour charges à répartir' }},
    },
  },
  '2': {
    classe: '2', nom: 'IMMOBILISATIONS',
    comptes: {
      '20': { libelle: 'Immobilisations en non-valeurs', sub: { '203': 'Frais préliminaires', '204': 'Charges immobilisées' }},
      '21': { libelle: 'Immobilisations incorporelles', sub: { '213': 'Brevets, licences, logiciels', '218': 'Autres immobilisations incorporelles' }},
      '22': { libelle: 'Immobilisations corporelles', sub: {
        '2234': 'Matériel de transport', '2235': 'Mobilier et matÉriel de bureau',
        '2236': 'Matériel informatique', '2238': 'Autres immobilisations corporelles',
      }},
      '23': { libelle: 'Terrains', sub: { '231': 'Terrains nus', '232': 'Terrains aménagés' }},
      '24': { libelle: 'Bâtiments, installations techniques', sub: { '241': 'Bâtiments', '244': 'Installations techniques' }},
      '26': { libelle: 'Titres et immobilisations financières', sub: { '261': 'Titres de participation', '268': 'Autres immobilisations financières' }},
      '27': { libelle: 'Immobilisations en cours', sub: { '271': 'Immobilisations corporelles en cours' }},
      '28': { libelle: 'Amortissements des immobilisations', sub: { '281': 'Amort. des immob. incorp.', '283': 'Amort. des immob. corp.' }},
      '29': { libelle: 'Provisions pour dépréciation', sub: { '291': 'Provisions pour dépréc. immob.', '296': 'Provisions pour dépréc. immob. financ.' }},
    },
  },
  '3': {
    classe: '3', nom: 'STOCKS',
    comptes: {
      '31': { libelle: 'Marchandises', sub: { '311': 'Marchandises A', '312': 'Marchandises B' }},
      '32': { libelle: 'Matières premières', sub: { '321': 'Matières premières', '322': 'Fournitures' }},
      '33': { libelle: 'Autres approvisionnements', sub: { '331': 'Matières et fournitures consommables' }},
      '34': { libelle: 'En-cours de production', sub: { '341': 'En-cours de production de biens' }},
      '35': { libelle: 'Produits en cours', sub: { '351': 'Produits en cours' }},
      '36': { libelle: 'Produits finis', sub: { '361': 'Produits finis', '362': 'Produits intermédiaires' }},
      '37': { libelle: 'Approvisionnements', sub: { '371': 'Approvisionnements en cours' }},
      '39': { libelle: 'Provisions pour dépréciation des stocks', sub: { '391': 'Provisions pour dépréciation des stocks' }},
    },
  },
  '4': {
    classe: '4', nom: 'TIERS',
    comptes: {
      '40': { libelle: 'Fournisseurs et comptes rattachés', sub: {
        '401': 'Fournisseurs', '403': 'Fournisseurs - Factures à réceptionner',
        '408': 'Fournisseurs - Créditores divers',
      }},
      '41': { libelle: 'Clients et comptes rattachés', sub: {
        '411': 'Clients', '413': 'Clients - Crédit vendeur',
        '416': 'Clients douteux', '418': 'Clients - Débiteurs divers',
      }},
      '42': { libelle: 'Personnel et comptes rattachés', sub: { '421': 'Personnel - Rémunérations dues', '425': 'Personnel - Avances et acomptes' }},
      '43': { libelle: 'Organismes sociaux', sub: { '431': 'CNPS', '437': 'Autres organismes sociaux' }},
      '44': { libelle: 'État et collectivités publiques', sub: {
        '441': 'État - Subventions à recevoir', '442': 'État - Impôts recouvrables',
        '443': 'État - Taxes sur le chiffre d\'affaires',
        '445': 'État - Autres impôts et taxes',
        '447': 'État - Taxes et impôts sur les rémunérations',
      }},
      '45': { libelle: 'Groupe et associés', sub: { '451': 'Groupe', '455': 'Associés - Opérations sur le capital' }},
      '46': { libelle: 'Débiteurs divers et créditeurs divers', sub: {
        '461': 'Débiteurs divers', '462': 'Créditeurs divers',
      }},
      '47': { libelle: 'Comptes transitoires d\'attente', sub: { '471': 'Comptes d\'attente' }},
      '48': { libelle: 'Charges et produits constatés d\'avance', sub: { '481': 'Charges à répartir', '486': 'Charges constatées d\'avance' }},
      '49': { libelle: 'Provisions pour dépréciation des comptes', sub: { '491': 'Provisions pour dépréciation des comptes' }},
    },
  },
  '5': {
    classe: '5', nom: 'FINANCIERS',
    comptes: {
      '50': { libelle: 'Valeurs mobilières de placement', sub: { '501': 'Valeurs mobilières de placement' }},
      '52': { libelle: 'Banques, établissements financiers', sub: {
        '521': 'Banques locales', '522': 'Banques étrangères',
        '526': 'Autres établissements financiers',
      }},
      '53': { libelle: 'Caisse', sub: { '531': 'Caisse sociale', '532': 'Caisse auxiliaire', '537': 'Caisse étrangère' }},
      '54': { libelle: 'Régies et agentes de l\'État', sub: { '541': 'Régies de recettes' }},
      '56': { libelle: 'Virements internes', sub: { '561': 'Virements internes' }},
      '58': { libelle: 'Virements inter-établissement', sub: { '581': 'Virements inter-établissement' }},
    },
  },
  '6': {
    classe: '6', nom: 'CHARGES PAR NATURE',
    comptes: {
      '60': { libelle: 'Achats', sub: {
        '601': 'Achats de matières premières', '602': 'Achats de fournitures',
        '604': 'Achats de marchandises', '605': 'Achats de mat. et fourn. consomm.',
        '608': 'Rabais, remises et ristournes obtenus',
      }},
      '61': { libelle: 'Autres charges externes', sub: {
        '611': 'Locations', '612': 'Locations - Charges accessoires',
        '613': 'Entretien et réparations', '614': 'Primes d\'assurance',
        '618': 'Autres charges externes',
      }},
      '62': { libelle: 'Autres charges externes (suite)', sub: {
        '621': 'Personnel extérieur à l\'entreprise',
        '622': 'Déplacements, missions et réceptions',
        '623': 'Transport et frais postaux', '624': 'Publicité, publications et relations publiques',
        '625': 'Services bancaires',
      }},
      '63': { libelle: 'Impôts et taxes', sub: {
        '631': 'Impôts et taxes directs',
        '633': 'Autres impôts, taxes et versements assimilés',
      }},
      '64': { libelle: 'Autres charges de gestion courante', sub: {
        '641': 'Rémunération du personnel',
        '645': 'Charges sociales',
        '646': 'Autres charges de personnel',
      }},
      '65': { libelle: 'Charges financières', sub: {
        '651': 'Charges d\'intérêts',
        '658': 'Autres charges financières',
      }},
      '66': { libelle: 'Exceptionnelles de gestion courante', sub: { '661': 'Charges exceptionnelles' }},
      '67': { libelle: 'Charges exceptionnelles', sub: { '671': 'Valeurs mobilières de placement', '678': 'Autres charges exceptionnelles' }},
      '68': { libelle: 'Dotations aux amortissements et provisions', sub: {
        '681': 'Dotations aux amortissements',
        '686': 'Dotations aux provisions',
      }},
      '69': { libelle: 'Impôts sur les bénéfices', sub: { '691': 'Impôts sur les bénéfices' }},
    },
  },
  '7': {
    classe: '7', nom: 'PRODUITS PAR NATURE',
    comptes: {
      '70': { libelle: 'Ventes de marchandises et de produits fabriqués', sub: {
        '701': 'Ventes de marchandises', '702': 'Ventes de produits fabriqués',
        '704': 'Ventes de produits achetés',
        '708': 'Rabais, remises et ristournes accordés',
      }},
      '71': { libelle: 'Chiffre d\'affaires', sub: { '711': 'Chiffre d\'affaires' }},
      '72': { libelle: 'Variation de stocks de produits', sub: { '721': 'Variation de stocks de produits' }},
      '73': { libelle: 'Immobilisations produites', sub: { '731': 'Immobilisations produites par l\'entreprise' }},
      '74': { libelle: 'Subventions d\'exploitation', sub: { '741': 'Subventions d\'exploitation' }},
      '75': { libelle: 'Autres produits de gestion courante', sub: {
        '751': 'Cessions d\'immobilisations',
        '758': 'Autres produits de gestion courante',
      }},
      '76': { libelle: 'Produits financiers', sub: {
        '761': 'Produits des titres de participation',
        '768': 'Autres produits financiers',
      }},
      '77': { libelle: 'Produits exceptionnels', sub: {
        '771': 'Produits exceptionnels',
        '778': 'Autres produits exceptionnels',
      }},
      '78': { libelle: 'Reprises sur pertes et charges', sub: { '781': 'Reprises sur dotations' }},
    },
  },
}

export const JOURNAUX = {
  'VTE': 'Journal des ventes',
  'ACH': 'Journal des achats',
  'BQ': 'Journal de banque',
  'CAI': 'Journal de caisse',
  'OD': 'Journal des opérations diverses',
  'AN': 'Journal des à-nouveaux',
  'ACH-RF': 'Journal des règlements fournisseurs',
  'VTE-RC': 'Journal des règlements clients',
}

export function getCompteLabel(numero) {
  for (const classe of Object.values(PLAN_COMPTABLE_OHADA)) {
    for (const [code, data] of Object.entries(classe.comptes)) {
      if (data.sub) {
        for (const [subCode, subLabel] of Object.entries(data.sub)) {
          if (subCode === numero) return `${subCode} - ${subLabel}`
        }
      }
      if (code === numero) return `${code} - ${data.libelle}`
    }
  }
  return numero
}

export function searchComptes(query) {
  const results = []
  const q = query.toLowerCase()
  for (const classe of Object.values(PLAN_COMPTABLE_OHADA)) {
    for (const [code, data] of Object.entries(classe.comptes)) {
      if (data.sub) {
        for (const [subCode, subLabel] of Object.entries(data.sub)) {
          if (subCode.includes(q) || subLabel.toLowerCase().includes(q)) {
            results.push({ numero: subCode, libelle: subLabel, classe: classe.classe })
          }
        }
      }
      if (code.includes(q) || data.libelle.toLowerCase().includes(q)) {
        results.push({ numero: code, libelle: data.libelle, classe: classe.classe })
      }
    }
  }
  return results.slice(0, 50)
}
