type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export default function Label(props: LabelProps) {
  return <label {...props} />;
}

