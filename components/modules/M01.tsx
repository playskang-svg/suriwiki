import { ModuleProps } from "@/lib/schemas/modules";

export default function M01({ body }: ModuleProps<"M01">) {
  return (
    <div className="bg-primary-fixed rounded-xl p-stack-lg mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-2">{body.answer}</h2>
      {body.qualifier && <p className="font-body-md text-[16px] text-on-surface-variant">{body.qualifier}</p>}
    </div>
  );
}
