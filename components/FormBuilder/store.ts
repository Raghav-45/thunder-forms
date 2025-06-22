import { create } from 'zustand'

type FormStore = {
  count: number
  inc: () => void
}

export const useFormStore = create<FormStore>()((set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))

// function Counter() {
//   const { count, inc } = useFormStore()
//   return (
//     <div>
//       <span>{count}</span>
//       <button onClick={inc}>one up</button>
//     </div>
//   )
// }
