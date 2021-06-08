import "./styles.scss";
import { 
  BaseComponent,
  LocaleService,
  LayoutService,
  TreeMenu,
  CapitalVizabiService,
  versionInfo
} from "VizabiSharedComponents";
import { VizabiSpreadsheet } from "./component";


export default class Spreadsheet extends BaseComponent {

  constructor(config){

    config.Vizabi.utils.applyDefaults(config.model.markers.spreadsheet.config, Spreadsheet.DEFAULT_CORE);    
    //clear constant if concept is set
    if (config.model.markers.spreadsheet.config.encoding.hook.data.concept) {
      config.model.markers.spreadsheet.config.encoding.hook.data.constant = undefined;
    }


    const marker = config.model.markers.spreadsheet;

    config.name = "spreadsheet";

    config.subcomponents = [{
      type: VizabiSpreadsheet,
      placeholder: ".vzb-spreadsheet",
      model: marker,
      name: "chart"
    },{
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      model: marker,
      name: "tree-menu"
    }];

    config.template = `
      <div class="vzb-spreadsheet"></div>
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
  chart: {
    fixHeaders: true
  },
};

Spreadsheet.DEFAULT_CORE = {
  requiredEncodings: ["hook"],
  encoding: {
    "hook": {
      data: {
        constant: "true"
      },
      scale: {
        allowedTypes: ["linear", "log", "genericLog", "pow", "point"]
      }
    },
    "label": {
      data: {
        modelType: "entityPropertyDataConfig"
      }
    },
    "frame": {
      modelType: "frame"
    }
  }
};

Spreadsheet.versionInfo = { version: __VERSION, build: __BUILD, package: __PACKAGE_JSON_FIELDS, sharedComponents: versionInfo};

