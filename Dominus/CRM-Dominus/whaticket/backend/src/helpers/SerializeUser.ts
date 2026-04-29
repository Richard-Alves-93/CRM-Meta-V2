export const SerializeUser = async (user: any) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile || user.role,
    companyId: user.company_id || user.companyId,
    company: user.company || null,
    super: !!user.super,
    queues: user.queues || [],
    startWork: user.start_work || user.startWork,
    endWork: user.end_work || user.endWork,
    allTicket: user.all_ticket || user.allTicket,
    whatsappId: user.whatsapp_id || user.whatsappId,
    profileImage: user.profile_image || user.profileImage,
    defaultTheme: user.default_theme || user.defaultTheme,
    defaultMenu: user.default_menu || user.defaultMenu,
    allHistoric: user.all_historic || user.allHistoric,
    allUserChat: user.all_user_chat || user.allUserChat,
    defaultTicketsManagerWidth: user.default_tickets_manager_width || user.defaultTicketsManagerWidth,
    userClosePendingTicket: user.user_close_pending_ticket || user.userClosePendingTicket,
    showDashboard: user.show_dashboard || user.showDashboard,
    allowGroup: !!user.allow_group || !!user.allowGroup,
    allowRealTime: user.allow_real_time || user.allowRealTime,
    allowConnections: user.allow_connections || user.allowConnections,
    canViewAllContacts: !!user.can_view_all_contacts || !!user.canViewAllContacts
  };
};
