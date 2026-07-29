import ConfirmDialog from '~/components/ConfirmDialog.vue'

// Masalan: if (await confirm({ title: 'O‘chirilsinmi?' })) { ... }
export function useConfirm() {
  const overlay = useOverlay()
  const modal = overlay.create(ConfirmDialog, { destroyOnClose: true })

  return async (props: InstanceType<typeof ConfirmDialog>['$props'] = {}) => {
    const result = await modal.open(props).result
    return result === true
  }
}
