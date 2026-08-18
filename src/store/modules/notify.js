import { getUnreadCount } from '@/api/biz/alert';

// 全局预警未读数（顶部通知铃铛 + 对话精灵悬浮角标共用）。
// ChatWidget 的 WebSocket 推送 / Navbar 挂载时调用 refreshUnreadCount 刷新，不再恒为 0。
const useNotifyStore = defineStore('notify', {
    state: () => ({
        unreadCount: 0
    }),
    actions: {
        refreshUnreadCount() {
            return getUnreadCount()
                .then((response) => {
                    this.unreadCount = response.data || 0;
                })
                .catch(() => {});
        }
    }
});

export default useNotifyStore;
