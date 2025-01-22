import { LucideProps } from 'lucide-react'

export const Icons = {
  ThunderFormsLogo: (props: LucideProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      height="1em"
      width="1em"
      fill="none"
    >
      <path
        fill="#FF822D"
        d="m17.831 3.306-9.726 13.9c-.26.37-.045.794.395.794h4c.35 0 .5.14.5.5v10.763c0 .71.86 1.02 1.27.45l9.618-12.828c.27-.37.052-.885-.388-.885H20c-.5 0-1-.5-1-1V3.5c0-.5-.76-.774-1.169-.194"
      />
    </svg>
  ),
}

export type Icon = keyof typeof Icons
