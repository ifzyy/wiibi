// ── Spec grid matching screenshot style ────────────────────────────────────
const SpecGrid = ({ specs }) => { if (!specs?.length) return null;
 return ( <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
{specs.map((spec, index) => ( <div 
 key={index} 
 className="bg-[#f9fafb] p-4 rounded-sm flex flex-col justify-between" >
 <p className="text-sm text-gray-500 mb-1.5 font-normal">
            {spec.label}
          </p> <p className="text-base font-bold text-black tracking-wide">
            {spec.value}
          </p> </div>))} </div> );
};
// ── Package specs ──────────────────────────────────────────────────────────
const PackageSpecification = ({ components, systemSpecs }) => (
  <div className="space-y-10">


    {components.length > 0 ? (
      components.map((comp, i) => (
        <div key={i}>
          <h3 className="text-base font-semibold text-gray-900 mb-4">{comp.name}</h3>
          {comp.specs?.length > 0 ? (
            <SpecGrid specs={comp.specs} />
          ) : (
            <p className="text-sm text-gray-400">No specs available.</p>
          )}
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">No package components available.</p>
    )}
  </div>
);

// ── Normal specs ───────────────────────────────────────────────────────────
const NormalSpecification = ({ specs }) => (
  <div>
    {specs?.length > 0 ? (
      <SpecGrid specs={specs} />
    ) : (
      <p className="text-sm text-gray-400">No specifications available for this product.</p>
    )}
  </div>
);

// ── Tab entry point ────────────────────────────────────────────────────────
const TabSpecification = ({ product }) => {
  const listingType = (product.listing_type || product.listingType || '').toLowerCase();
  const isPackage   = listingType === 'package';
  const components  = product.components || [];
  const systemSpecs = product.systemSpecification || product.system_specification || [];
  const flatSpecs   = product.specifications || [];

  return isPackage
    ? <PackageSpecification components={components} systemSpecs={systemSpecs} />
    : <NormalSpecification specs={flatSpecs} />;
};

export default TabSpecification;