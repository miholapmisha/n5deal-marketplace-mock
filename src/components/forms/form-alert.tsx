export function FormAlert({ message }: { message: string }) {
  return (
    <p data-form-alert tabIndex={-1} role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none">
      {message}
    </p>
  );
}
