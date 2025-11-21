import "./styles.scss";
import { 
  BaseComponent,
  LocaleService,
  LayoutService,
  TreeMenu,
  CapitalVizabiService,
  MarkerContextmenu,
  Dialogs,
  ButtonList,
  versionInfo
} from "@vizabi/shared-components";
import { VizabiSpreadsheet } from "./spreadsheet-cmp.js";


export default class Spreadsheet extends BaseComponent {

  constructor(config){

    config.Vizabi.utils.applyDefaults(config.model.markers?.spreadsheet?.config || {}, Spreadsheet.DEFAULT_MODEL.spreadsheet);    
    //clear constant if concept is set TODO: move to encoding model probably?
    if (config.model.markers.spreadsheet.config.encoding.number.data.concept) {
      config.model.markers.spreadsheet.config.encoding.number.data.constant = undefined;
    }


    const marker = config.model.markers.spreadsheet;

    config.name = "spreadsheet";

    config.subcomponents = [{
      type: VizabiSpreadsheet,
      placeholder: ".vzb-spreadsheet",
      model: marker,
      name: "chart"
    }, {
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      model: marker,
      name: "tree-menu"
    },{
      type: MarkerContextmenu,
      placeholder: ".vzb-marker-contextmenu",
      model: marker,
      name: "marker-contextmenu"
    },{
      type: Dialogs,
      placeholder: ".vzb-dialogs",
      model: marker,
      name: "dialogs"
    },{
      type: ButtonList,
      placeholder: ".vzb-buttonlist",
      model: marker,
      name: "buttons"
    }];

    config.template = `
      <div class="vzb-spreadsheet"></div>
      <div class="vzb-sidebar">
        <div class="vzb-dialogs"></div>
        <div class="vzb-buttonlist"></div>
      </div>
      <div class="vzb-marker-contextmenu"></div>
      <div class="vzb-treemenu"></div>
    `;
  
    config.services = {
      Vizabi: new CapitalVizabiService({Vizabi: config.Vizabi}),
      locale: new LocaleService(config.locale),
      layout: new LayoutService({placeholder: config.placeholder})
    };

    super(config);
  }
}


Spreadsheet.DEFAULT_UI = {
  "locale": { "id": "en", "shortNumberFormat": true },
  "layout": { "projector": false },

  "buttons": {
    "buttons": ["markercontrols", "pivot", "moreoptions", "sidebarcollapse"]
  },
  "dialogs": {
    "dialogs": {
      "popup": ["markercontrols", "moreoptions"],
      "sidebar": ["markercontrols"],
      "moreoptions": ["about"]
    },
    "markercontrols": {
      "disableSlice": true,
      "disableAddRemoveGroups": true,
      "primaryDim": null,
      "drilldown": null,
      "shortcutForSwitch": false,
      "shortcutForSwitch_allow": null
    }
  },
  "marker-contextmenu": {
    "primaryDim": null,
    "drilldown": null,
  },
  "tree-menu": {
    "showDataSources": false,
    "folderStrategyByDataset": {}
  },
  "chart": {
    "fixHeaders": true,
    "pivot": true,
    "opacitySelectDim": 0.3,
    "sendTools": []
  },
};

Spreadsheet.DEFAULT_MODEL = {
  "spreadsheet": {
    "requiredEncodings": ["number"],
    "encoding": {
      "show": {
        "modelType": "selection"
      },
      "selected": {
        "modelType": "selection"
      },
      "highlighted": {
        "modelType": "selection"
      },
      "superhighlighted": {
        "modelType": "selection"
      },
      "number": {
        "data": {
          "constant": "true"
        },
        "scale": {
          "allowedTypes": null
        }
      },
      "label": {
        "data": {
          "modelType": "entityPropertyDataConfig"
        }
      },
      "frame": {
        "modelType": "frame"
      },
      "color": {
        "data": {
          "constant": "_default"
        },
        "scale": {
          "modelType": "color",
          "type": "ordinal"
        }
      }
    }
  }
};

Spreadsheet.versionInfo = { version: __VERSION, build: __BUILD, package: __PACKAGE_JSON_FIELDS, sharedComponents: versionInfo};

