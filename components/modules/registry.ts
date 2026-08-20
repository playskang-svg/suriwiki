import { ComponentType } from "react";
import M01 from "./M01";
import M02 from "./M02";
import M03 from "./M03";
import M04 from "./M04";
import M05 from "./M05";
import M06 from "./M06";
import M07 from "./M07";
import M08 from "./M08";
import M09 from "./M09";
import M10 from "./M10";
import M11 from "./M11";
import M12 from "./M12";
import M13 from "./M13";
import M14 from "./M14";
import M15 from "./M15";
import M16 from "./M16";
import M17 from "./M17";
import M18 from "./M18";
import M19 from "./M19";
import M20 from "./M20";
import M21 from "./M21";
import M22 from "./M22";
import M23 from "./M23";
import M24 from "./M24";
import modulesData from "@/data/modules.json";

export const ModuleRegistry: Record<string, ComponentType<any>> = {
  M01, M02, M03, M04, M05, M06, M07, M08,
  M09, M10, M11, M12, M13, M14, M15, M16,
  M17, M18, M19, M20, M21, M22, M23, M24,
};

export function assertAllModulesRegistered() {
  const definedModules = modulesData.modules.map((m: any) => m.code);
  
  if (definedModules.length !== 24) {
    throw new Error(`Expected 24 modules in data/modules.json, found ${definedModules.length}`);
  }

  for (const code of definedModules) {
    if (!ModuleRegistry[code]) {
      throw new Error(`Module ${code} is missing from ModuleRegistry`);
    }
  }
}
