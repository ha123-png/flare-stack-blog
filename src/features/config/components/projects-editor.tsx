import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SystemConfig } from "../config.schema";
import { tagsAdminQueryOptions } from "@/features/tags/queries";
import { AssetUploadField } from "./asset-upload-field";
import { Field } from "./site-settings-fields";

export function ProjectsEditor() {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SystemConfig>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "site.projects",
    keyName: "formKey",
  });
  const tags = useQuery(tagsAdminQueryOptions());
  return (
    <div className="md:col-span-2 space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="首页欢迎语" error={errors.site?.welcome?.title?.message}>
          <Input {...register("site.welcome.title")} />
        </Field>
        <Field
          label="欢迎语说明"
          error={errors.site?.welcome?.description?.message}
        >
          <Textarea {...register("site.welcome.description")} />
        </Field>
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-medium">作品与实践</h4>
        <p className="text-sm text-muted-foreground">
          这里的顺序用于首页、项目目录和我的站点。关联标签只为这个项目归集公开文章，不会把其他标签变成项目。
        </p>
      </div>
      {fields.map((field, index) => {
        const project = watch(`site.projects.${index}`);
        const selected = project?.tagNames ?? [];
        const available = [
          ...new Set([
            ...(tags.data ?? []).map((tag) => tag.name),
            ...selected,
          ]),
        ].filter((name) => !name.startsWith("_chroma:"));
        const error = errors.site?.projects?.[index];
        return (
          <fieldset
            key={field.formKey}
            className="space-y-6 border border-border/40 p-5 sm:p-7"
          >
            <legend className="px-2 text-sm">
              {String(index + 1).padStart(2, "0")} ·{" "}
              {project?.title || "新项目"}
            </legend>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                aria-label={`上移${project?.title}`}
                disabled={!index}
                onClick={() => move(index, index - 1)}
                className="p-2 disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label={`下移${project?.title}`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                className="p-2 disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label={`移除${project?.title}`}
                onClick={() => remove(index)}
                className="p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="项目名称" error={error?.title?.message}>
                <Input {...register(`site.projects.${index}.title`)} />
              </Field>
              <Field
                label="项目标识"
                hint="用于页面地址；上线后建议保留这个标识。"
                error={error?.id?.message}
              >
                <Input
                  {...register(`site.projects.${index}.id`)}
                  placeholder="my-project"
                />
              </Field>
              <Field label="类型" error={error?.category?.message}>
                <Input {...register(`site.projects.${index}.category`)} />
              </Field>
              <Field label="访问地址" error={error?.url?.message}>
                <Input
                  {...register(`site.projects.${index}.url`)}
                  placeholder="https://"
                />
              </Field>
              <Field label="状态" error={error?.status?.message}>
                <Input {...register(`site.projects.${index}.status`)} />
              </Field>
              <Field label="年份" error={error?.year?.message}>
                <Input {...register(`site.projects.${index}.year`)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="项目介绍" error={error?.description?.message}>
                  <Textarea
                    {...register(`site.projects.${index}.description`)}
                    rows={3}
                  />
                </Field>
              </div>
              <AssetUploadField
                name={`site.projects.${index}.image`}
                assetPath={`themes/szweb/projects/${field.formKey}/cover`}
                label="真实项目封面"
                hint="建议使用网站首屏，宽高比 8:5；也可以填写图片地址。"
                accept=".png,.jpg,.jpeg,.webp"
                error={error?.image?.message}
              />
              <Field label="纸边点色">
                <select
                  {...register(`site.projects.${index}.accent`)}
                  className="w-full h-10 border border-input bg-background px-3 text-sm"
                >
                  <option value="cobalt">墨蓝</option>
                  <option value="emerald">春绿</option>
                  <option value="copper">铜色</option>
                  <option value="lacquer">朱红</option>
                  <option value="petroleum">青墨</option>
                  <option value="violet">紫灰</option>
                </select>
              </Field>
              <Field
                label="开篇文章标识（可留空）"
                hint="填写文章地址中 /post/ 后的部分。这篇文章也会出现在项目手记里。"
                error={error?.leadSlug?.message}
              >
                <Input {...register(`site.projects.${index}.leadSlug`)} />
              </Field>
              <div className="space-y-3">
                <p className="text-sm font-medium">关联标签</p>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  {available.map((name) => (
                    <label
                      key={name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(name)}
                        onChange={(event) =>
                          setValue(
                            `site.projects.${index}.tagNames`,
                            event.target.checked
                              ? [...selected, name]
                              : selected.filter((item) => item !== name),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                      />
                      {name}
                    </label>
                  ))}
                </div>
                {tags.isPending && (
                  <p className="text-xs text-muted-foreground">正在读取标签…</p>
                )}
                {tags.isError && (
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => void tags.refetch()}
                  >
                    重新读取标签
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  先在文章中添加项目标签，再到这里勾选。标签改名后请重新选择。
                </p>
              </div>
            </div>
          </fieldset>
        );
      })}
      {errors.site?.projects?.root?.message && (
        <p className="text-sm text-destructive">
          {errors.site.projects.root.message}
        </p>
      )}
      <button
        type="button"
        className="inline-flex gap-2 items-center border border-border px-4 py-2 text-sm"
        onClick={() =>
          append({
            id: `project-${Date.now().toString(36)}`,
            title: "新项目",
            category: "",
            description: "",
            year: String(new Date().getFullYear()),
            status: "进行中",
            url: "",
            image: "",
            accent: "cobalt",
            tagNames: [],
            leadSlug: "",
          })
        }
      >
        <Plus size={16} />
        添加项目
      </button>
      <p className="text-xs text-muted-foreground">
        修改后点击“应用更改”生效。
      </p>
    </div>
  );
}
