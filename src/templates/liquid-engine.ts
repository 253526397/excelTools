import { Liquid } from 'liquidjs';
import type { Language } from '../config/config.interfaces';
import type { FieldSchema } from '../models/schema.interfaces';
import { mapFieldType, getDefaultValue } from './filters/type-mapping';
import { toCase } from './filters/naming';

let engine: Liquid | null = null;

export function getLiquidEngine(): Liquid {
  if (!engine) {
    engine = new Liquid({
      cache: true,
      strictFilters: true,
      strictVariables: false,
    });
  }
  return engine;
}

/**
 * 为特定语言和枚举集合创建一个渲染上下文，
 * 返回带有自定义过滤器的 Liquid 实例 + 模板变量增强函数
 */
export function createTemplateContext(
  lang: Language,
  enumKeys: Set<string>
) {
  const liquid = getLiquidEngine();

  return {
    liquid,

    /**
     * 构建模板变量
     */
    buildVariables(params: {
      tableName: string;
      sourceFile: string;
      fields: FieldSchema[];
      namespace?: string | null;
      package?: string | null;
      importedEnums?: string[];
    }) {
      const { tableName, sourceFile, fields, namespace, package: pkg, importedEnums } = params;

      const enrichedFields = fields.map((field) => ({
        name: field.name,
        type: field.type,
        comment: field.comment,
        isArray: field.isArray,
        is2DArray: field.is2DArray,
        isEnum: field.isEnum,
        isNested: field.isNested,
        mappedType: mapFieldType(field, lang, enumKeys),
        defaultValue: getDefaultValue(field, lang),
        propertyName: toCase(field.name, 'camelCase'),
        pascalName: toCase(field.name, 'PascalCase'),
      }));

      return {
        tableName,
        sourceFile,
        fields: enrichedFields,
        namespace: namespace ?? null,
        package: pkg ?? null,
        generatedAt: new Date().toISOString(),
        importedEnums: importedEnums ?? [],
      };
    },
  };
}

export function resetEngine(): void {
  engine = null;
}
