
const translations = {
    en: {
        title: "Sabine Wren",
        description: "Aggressive Phoenix Attacker that permanently strips Defense and punishes slower enemies",
        lightSide: "Light Side",
        attacker: "Attacker",
        mandalorian: "Mandalorian",
        phoenix: "Phoenix",
        rebel: "Rebel",
        crewMembers: "Crew Members",
        basicAttackTitle: "Basic Attack: Blaster Akimbo",
        basicAttack: "Deal Physical damage to target enemy twice.\nThis attack scores an additional hit for each of the following if the target:\n- Has less than 70% Turn Meter\n- Has less than 30% Turn Meter\n- The target is debuffed\nAdditional hits deal 75% less damage.",
        specialAttack1Title: "1st Special: Darksaber Strike (Cooldown: 2)",
        specialAttack1: "Deal Physical damage to target enemy and inflict Armor Shred for the rest of the battle.",
        specialAttack2Title: "2nd Special: Demolish (Cooldown: 5)",
        specialAttack2: "Deal Physical damage to all enemies, Stagger them for 2 turns, and Expose target enemy for 2 turns.\nFor each active Mandalorian and Phoenix ally, deal +15% more damage and Expose a random enemy for 2 turns.\nMandalorian and Phoenix allies gain Critical Chance Up and Offense Up for 2 turns.\nIf this attack scores a critical hit, reduce Sabine's cooldowns by 2.\nThis attack can't be countered or evaded.",
        uniqueAbilityTitle: "Unique Ability: Take It Back",
        uniqueAbility: "Sabine has +25% Critical Chance and +25% Critical Damage.",
        shipTitle: "Ship: Phantom II"
    },
    fr: {
        title: "Sabine Wren",
        description: "Attaquante Phoenix aggressive qui supprime la défense de manière permanente et punit les ennemis lents.",
        lightSide: "Coté Lumineux",
        attacker: "Attaquant",
        mandalorian: "Mandalorien",
        phoenix: "Phoenix",
        rebel: "Rebelle",
        crewMembers: "Membres Equipages",
        basicAttackTitle: "attaque basique : Blaster sur les hanches",
        basicAttack: "Inflige des dégâts physiques à une cible ennemie deux fois.\n Chacune de des attaques inflige un coup supplémentaire si:\n- la jauge de tour de la cible est à moins de 70%.\n- la jauge de tour de la cible est à moins de 30%.\n- si la cible souffre d'affaiblissements.\nLes coups supplémentaires infligent 75% de dégâts en moins.",
        specialAttack1Title: "1ere spéciale: Frappe au sabre noir (délai: 2)",
        specialAttack1: "Inflige des dégâts physiques à la cible ennemie et lui inflige la destruction d'armure pendant le reste de l'affrontement.",
        specialAttack2Title: "2eme spéciale: Démolition (délai: 5)",
        specialAttack2: "Inflige des dégâts physiques à tous les ennemis et leur inflige Faux pas pendant 2 tours. La cible ennemie subit également exposition pendant 2 tours. Pour chaque allié Mandalorien ou Phoenix actif, inflige +15% de dégâts supplémentaires et expose un ennemi aléatoire pendant 2 tours. Les alliés Mandaloriens et Phoenix obtiennent un bonus de chances de coup critiques et un bonus d'attaque pendant 2 tours. Si cette attaque inflige un coup critique, les délais de Sabine sont diminués de 2.\nCette attaque ne peut pas être contrée ou esquivée.",
        uniqueAbilityTitle: "capacité unique: Contre-offensive",
        uniqueAbility: "Sabine obtient un bonus de chances de coup critiques de +25% et un bonus de dégâts critiques de +25%.",
        shipTitle: "vaisseau: phantom2"
    }
};
// Set the default language to English on page load
window.onload = function () {
    switchLanguage('en');
};

function switchLanguage(lang) {
    const elements = {
        title: "title",
        description: "description",
        lightSide: "light-side",
        attacker: "attacker",
        mandalorian: "mandalorian",
        phoenix: "phoenix",
        rebel: "rebel",
        crewMembers: "crew-members",
        basicAttackTitle: "basic-attack-title",
        basicAttack: "basic-attack",
        specialAttack1Title: "special-attack1-title",
        specialAttack1: "special-attack1",
        specialAttack2Title: "special-attack2-title",
        specialAttack2: "special-attack2",
        uniqueAbilityTitle: "unique-ability-title",
        uniqueAbility: "unique-ability",
        shipTitle: "ship-title"
    };

    for (const [key, id] of Object.entries(elements)) {
        let textContent = translations[lang][key];

        // Remplacer les '\n' par des balises <br> pour ajouter des sauts de ligne
        if (textContent) {
            textContent = textContent.replace(/\n/g, '<br>');
        }

        // Mettre à jour l'élément avec le texte modifié
        document.getElementById(id).innerHTML = textContent;
    }
}
