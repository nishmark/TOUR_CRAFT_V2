import Image from "next/image";

export default function Example() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* We've used 3xl here, but feel free to try other max-widths based on your needs */}
      <Image
        className="w-full h-full object-cover"
        width={1000}
        height={1000}
        src="/heroimage.jpeg"
        alt="Hero Image"
      />
      <div className="mx-auto max-w-3xl">{/* Content goes here */}</div>
    </div>
  );
}
