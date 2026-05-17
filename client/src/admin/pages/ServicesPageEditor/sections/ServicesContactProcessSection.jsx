/**
 * ServicesContactProcessSection.jsx
 *
 * The "contact_process" section. Composes three parts:
 *  1. ContactProcessHeader  — full-width bordered band with editable heading
 *  2. ProcessSteps          — left column: ordered step list with icons
 *  3. QuoteForm             — right column: property-type-aware quote form
 *
 * All edits route through the callbacks passed from useServicesEditor.
 */

import ContactProcessHeader from "./ContactProcessHeader";
import ProcessSteps         from "./ProcessSteps";
import QuoteForm            from "./QuoteForm";

/**
 * @param {{
 *   section              : object,   the contact_process section
 *   onUpdateContent      : (dotPath: string, value: string) => void,
 *   onUpdateProcessStep  : (index: number, field: string, value: string) => void,
 *   onUpdateFormField    : (index: number, field: string, value: string) => void,
 *   onUpdateSubmitText   : (value: string) => void,
 * }} props
 */
const ServicesContactProcessSection = ({
  section,
  onUpdateContent,
  onUpdateProcessStep,
  onUpdateFormField,
  onUpdateSubmitText,
}) => (
  <section className="py-24">

    {/* Full-width header band */}
    <ContactProcessHeader
      header={section.content.header}
      onUpdateContent={onUpdateContent}
    />

    {/* Two-column layout: process steps (left) + quote form (right) */}
    <div className="grid lg:grid-cols-2 gap-20 max-w-7xl mx-auto px-6 py-8">

      <ProcessSteps
        steps={section.content.process_steps}
        onUpdate={onUpdateProcessStep}
      />

      <QuoteForm
        formSettings={section.content.form_settings}
        onUpdateFormField={onUpdateFormField}
        onUpdateSubmitText={onUpdateSubmitText}
      />

    </div>
  </section>
);

export default ServicesContactProcessSection;