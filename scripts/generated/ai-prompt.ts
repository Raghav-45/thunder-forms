// This file is auto-generated from types.ts
// Do not edit manually - run 'npm run generate-prompt' to regenerate

export const DYNAMIC_SYSTEM_PROMPT = `You are an AI assistant with access to these field types:

- text-input: {
  "id": "text_1750677166850",
  "uniqueIdentifier": "text-input",
  "label": "Your Name",
  "placeholder": "e.g., John Doe",
  "description": "Provide your name for identification.",
  "required": false,
  "disabled": false,
  "inputType": "text"
}
- multi-select: {
  "id": "multiselect_1750677166850",
  "uniqueIdentifier": "multi-select",
  "label": "Select your framework",
  "placeholder": "Select multiple options",
  "required": false,
  "disabled": false,
  "options": [
    {
      "label": "Apple",
      "value": "apple"
    },
    {
      "label": "Banana",
      "value": "banana"
    },
    {
      "label": "Blueberry",
      "value": "blueberry"
    },
    {
      "label": "Grapes",
      "value": "grapes"
    },
    {
      "label": "Pineapple",
      "value": "pineapple"
    }
  ],
  "searchable": true,
  "allowCustomValues": false
}
- text-area: {
  "id": "textarea_1750677166850",
  "uniqueIdentifier": "text-area",
  "label": "Your Message",
  "placeholder": "Type your message here.",
  "description": "Your message will be copied to the support team.",
  "required": false,
  "disabled": false
}
- switch-field: {
  "id": "switch_1750677166850",
  "type": "switch",
  "uniqueIdentifier": "switch-field",
  "label": "Your Message",
  "placeholder": "Type your message here.",
  "description": "Your message will be copied to the support team.",
  "required": false,
  "disabled": false,
  "defaultValue": false,
  "checkedLabel": "On",
  "uncheckedLabel": "Off"
}

Available fields: text-input, multi-select, text-area, switch-field
Total field count: 4
Generated at: 2025-06-23T11:12:46.850Z
`;

export const FIELD_CONFIGS = {
  text-input: {
  "id": "text_1750677166852",
  "uniqueIdentifier": "text-input",
  "label": "Your Name",
  "placeholder": "e.g., John Doe",
  "description": "Provide your name for identification.",
  "required": false,
  "disabled": false,
  "inputType": "text"
},
  multi-select: {
  "id": "multiselect_1750677166852",
  "uniqueIdentifier": "multi-select",
  "label": "Select your framework",
  "placeholder": "Select multiple options",
  "required": false,
  "disabled": false,
  "options": [
    {
      "label": "Apple",
      "value": "apple"
    },
    {
      "label": "Banana",
      "value": "banana"
    },
    {
      "label": "Blueberry",
      "value": "blueberry"
    },
    {
      "label": "Grapes",
      "value": "grapes"
    },
    {
      "label": "Pineapple",
      "value": "pineapple"
    }
  ],
  "searchable": true,
  "allowCustomValues": false
},
  text-area: {
  "id": "textarea_1750677166852",
  "uniqueIdentifier": "text-area",
  "label": "Your Message",
  "placeholder": "Type your message here.",
  "description": "Your message will be copied to the support team.",
  "required": false,
  "disabled": false
},
  switch-field: {
  "id": "switch_1750677166852",
  "type": "switch",
  "uniqueIdentifier": "switch-field",
  "label": "Your Message",
  "placeholder": "Type your message here.",
  "description": "Your message will be copied to the support team.",
  "required": false,
  "disabled": false,
  "defaultValue": false,
  "checkedLabel": "On",
  "uncheckedLabel": "Off"
}
};
