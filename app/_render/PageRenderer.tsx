import { ModuleRegistry, assertAllModulesRegistered } from "@/components/modules/registry";

assertAllModulesRegistered();

type PageModules = Record<string, any>;

interface PageRendererProps {
  title: string;
  moduleOrder: string[];
  pageModules: PageModules;
}

export default function PageRenderer({ title, moduleOrder, pageModules }: PageRendererProps) {
  return (
    <div className="flex flex-col">
      <h1 className="sr-only">{title}</h1>
      {moduleOrder.map((code, idx) => {
        const ModuleComponent = ModuleRegistry[code];
        const body = pageModules[code];

        if (!ModuleComponent) {
          console.warn(`Module ${code} not found in registry.`);
          return null;
        }

        if (!body) {
          // 근거 데이터가 없으면 렌더링하지 않음
          return null;
        }

        return <ModuleComponent key={`${code}-${idx}`} body={body} />;
      })}
    </div>
  );
}
