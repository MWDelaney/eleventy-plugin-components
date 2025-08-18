/**
 * Add filters for the component system
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} options - Plugin options
 */
export function addFilters(eleventyConfig, options) {
  /**
   * Render Component Filter
   *
   * A component template resolver that matches content items to their corresponding
   * component templates based on type. This filter enables dynamic component rendering
   * by finding the appropriate template for a given content item.
   *
   * @filter renderComponent
   * @since 1.0.0
   *
   * @description
   * This filter takes a content item with a 'type' property and searches through
   * the components collection to find a matching component template. The matching
   * is performed by comparing the slugified version of the component's title
   * (from frontmatter) with the slugified version of the item's type.
   *
   * @param {Object|Array} items - The content item(s) to find component templates for
   * @param {string} items.type - Required. The component type identifier (e.g., "callout", "hero", "text-and-image")
   * @param {*} [...items.props] - Optional. Any additional properties that will be passed to the component when rendered
   * @param {string} templateLang - Optional. Template language to use for rendering ("liquid", "njk", "vto", etc.). Defaults to "liquid"
   *
   * @returns {string} The fully rendered HTML content of the matching component(s), or empty string if no match found
   *
   * @example
   * // Component file: src/assets/components/callout.njk
   * // ---
   * // title: Callout
   * // ---
   * // <div class="callout">{{ heading }}</div>
   *
   * // Content item:
   * const item = {
   *   type: "callout",
   *   heading: "Important Notice",
   *   description: "This is important"
   * };
   *
   * // Template usage:
   * {{ item | renderComponent("njk") | safe }}
   *
   * @example
   * // Template usage in a loop:
   * {%- for item in components -%}
   *   {{- item | renderComponent("njk") | safe -}}
   * {%- endfor -%}
   *
   * @workflow
   * 1. Validates input item has required 'type' property
   * 2. Accesses the Eleventy components collection
   * 3. Loops through all available component templates
   * 4. Compares slugified component title with slugified item type
   * 5. Renders the matching component template with item data
   * 6. Returns fully rendered HTML content
   *
   * @dependencies
   * - Requires components collection to be populated (handled by plugin)
   * - Requires Eleventy's built-in slugify filter
   * - Uses EleventyRenderPlugin's renderContent filter internally for rendering
   *
   * @matching-logic
   * Component matching uses case-insensitive, URL-safe slug comparison:
   * - Component title "Text and Image" → slug "text-and-image"
   * - Item type "text-and-image" → slug "text-and-image"
   * - Match found ✅
   *
   * @error-handling
   * - Returns empty string for invalid/missing input
   * - Returns empty string if no matching component found
   * - Gracefully handles missing collections or component data
   * - No exceptions thrown, fails silently for template safety
   *
   * @performance-notes
   * - O(n) complexity where n = number of component templates
   * - First match wins, stops searching after finding match
   * - Consider component organization if using many templates
   *
   * @see {@link https://www.11ty.dev/docs/filters/} Eleventy Filters Documentation
   * @see {@link https://www.11ty.dev/docs/plugins/render/} Eleventy Render Plugin Documentation
   */

  // Render components filter - returns matched component templates
  // Render components filter - returns matched component templates
  eleventyConfig.addFilter("renderComponent", async function (items, templateLang = "liquid") {
    if (!items) {
      return '';
    }

    // Normalize input to always be an array
    const itemsArray = Array.isArray(items) ? items : [items];

    // Filter out any items without a type
    const validItems = itemsArray.filter(item => item && item.type);

    if (validItems.length === 0) {
      return '';
    }

    const collections = this.ctx.collections || this.collections;
    if (!collections || !collections.components) {
      return '';
    }

    const slugifyFilter = eleventyConfig.getFilter("slugify");
    const renderFilter = eleventyConfig.getFilter("renderContent");
    const renderedComponents = [];

    // Process each item
    for (const item of validItems) {
      // Find the matching component in the collections
      for (const component of collections.components) {
        if (component.data && component.data.title) {
          const componentSlug = slugifyFilter(component.data.title);
          const itemSlug = slugifyFilter(item.type);

          if (componentSlug === itemSlug) {
            // Render the component's rawInput with item data using the specified template language
            const rendered = await renderFilter.call(this, component.rawInput, templateLang, item);
            renderedComponents.push(rendered);
            break; // Move to next item after finding a match
          }
        }
      }
    }

    // Join all rendered components with newlines
    return renderedComponents.join('\n');
  })
}
