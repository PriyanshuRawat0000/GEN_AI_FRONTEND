export default function renderUploadBox(
  file: File | null,
  setFile: (f: File | null) => void,
  label: string,
) {
  return (
    <label className="w-full max-w-2xl h-80 border border-dashed rounded-lg bg-[#111] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition relative overflow-hidden">
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />

      {file ? (
        <img
          src={URL.createObjectURL(file)}
          className="w-full h-full object-cover rounded-lg"
          alt={label}
        />
      ) : (
        <span className="text-sm text-gray-400 text-center px-4">{label}</span>
      )}
    </label>
  );
}