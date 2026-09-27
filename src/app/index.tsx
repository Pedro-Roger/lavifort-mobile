import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { Task, StatusTarefa } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';
import { useTasksStore } from '@/stores/tasks.store';
import { localDatabase } from '@/services/sync/local-database';
import { Avatar, OfflineBanner } from '@/components/ui';
import {
  ProjectSelector,
  TaskList,
  KanbanBoard,
  ViewModeToggle,
  CreateTaskModal,
  TaskDetailModal,
} from '@/components/tasks';

export default function IndexScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { init: initSync, isConnected, isSyncing, pendingCount, errorCount, syncNow } = useSyncStore();
  const {
    tasks,
    projects,
    selectedProjectId,
    loadProjects,
    selectProject,
    loadTasks,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isRefreshing,
    refreshTasks,
    getFilteredTasks,
    isLoading,
    createTask,
    updateTask,
    updateTaskStatus,
    updateTaskProgress,
    deleteTask,
    transferTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    captureAndAddPhoto,
    pickAndAddPhoto,
    deleteAttachment,
  } = useTasksStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    initSync();
    loadProjects().then(() => {
      loadTasks();
    });
  }, [initSync, loadProjects, loadTasks]);

  const filteredTasks = useMemo(() => {
    return getFilteredTasks();
  }, [tasks, getFilteredTasks, searchQuery, statusFilter, selectedProjectId]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSyncPress = async () => {
    if (isConnected && !isSyncing) {
      await syncNow(selectedProjectId || undefined);
      await loadTasks();
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateStatus = async (id: string, status: StatusTarefa) => {
    const updated = await updateTaskStatus(id, status);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleUpdateProgress = async (id: string, progresso: number) => {
    const updated = await updateTaskProgress(id, progresso);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await updateTask(id, updates);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleAddSubtask = async (taskId: string, titulo: string) => {
    const updated = await addSubtask(taskId, titulo);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const updated = await toggleSubtask(taskId, subtaskId);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    const updated = await deleteSubtask(taskId, subtaskId);
    if (updated) setSelectedTask(updated);
    return updated;
  };

  const handleCapturePhoto = async (taskId: string) => {
    const attachment = await captureAndAddPhoto(taskId);
    if (attachment) {
      const fresh = await localDatabase.getTaskById(taskId);
      if (fresh) setSelectedTask(fresh);
    }
    return attachment;
  };

  const handlePickPhoto = async (taskId: string) => {
    const attachment = await pickAndAddPhoto(taskId);
    if (attachment) {
      const fresh = await localDatabase.getTaskById(taskId);
      if (fresh) setSelectedTask(fresh);
    }
    return attachment;
  };

  const handleDeleteAttachment = async (taskId: string, attachmentId: string) => {
    const success = await deleteAttachment(taskId, attachmentId);
    if (success) {
      const fresh = await localDatabase.getTaskById(taskId);
      if (fresh) setSelectedTask(fresh);
    }
    return success;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Offline and Sync Status Banner */}
      <OfflineBanner
        isConnected={isConnected}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        errorCount={errorCount}
        onSyncPress={handleSyncPress}
        onPressBanner={() => router.push('/sync-status')}
      />

      {/* Top Header */}
      <View style={styles.header} testID="app-header">
        <View style={styles.headerLeft}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>LF</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>LarviFort CRM</Text>
            <Text style={styles.headerSubtitle}>
              {user ? user.nome || user.email : 'Painel Operacional'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            testID="modules-header-button"
            accessibilityRole="button"
            accessibilityLabel="Abrir módulos"
            style={styles.modulesIconButton}
            onPress={() => router.push('/modules')}
            activeOpacity={0.7}
          >
            <Text style={styles.modulesIconText}>Módulos</Text>
          </TouchableOpacity>
          <ViewModeToggle
            mode={viewMode}
            onChangeMode={setViewMode}
            testID="view-mode-toggle"
          />
          <TouchableOpacity
            testID="sync-status-header-button"
            accessibilityRole="button"
            accessibilityLabel="Ver status de sincronização"
            style={styles.syncIconButton}
            onPress={() => router.push('/sync-status')}
            activeOpacity={0.7}
          >
            <Text style={styles.syncIconText}>Sync</Text>
            {(pendingCount > 0 || errorCount > 0) && (
              <View
                style={[
                  styles.syncBadgeDot,
                  errorCount > 0 ? styles.syncBadgeDotError : styles.syncBadgeDotPending,
                ]}
                testID="sync-status-dot"
              />
            )}
          </TouchableOpacity>
          {user && (
            <Avatar
              name={user.nome || user.email}
              size="sm"
              style={styles.headerAvatar}
            />
          )}
          <TouchableOpacity
            testID="logout-header-button"
            accessibilityRole="button"
            accessibilityLabel="Encerrar sessão"
            style={styles.logoutIconButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIconText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Project / Sector Selector */}
      <View style={styles.selectorWrapper}>
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => selectProject(id)}
          showAllOption
        />
      </View>

      {/* Main Board / List View */}
      <View style={styles.listWrapper}>
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={refreshTasks}
            onTaskPress={handleTaskPress}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            testID="kanban-board"
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={refreshTasks}
            onTaskPress={handleTaskPress}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={statusFilter}
            onStatusFilterChange={setStatusFilter}
            testID="task-list"
          />
        )}
      </View>

      {/* Floating Action Button (FAB) - Quick Task Creation */}
      <TouchableOpacity
        testID="create-task-fab"
        style={styles.fabButton}
        onPress={() => setIsCreateModalOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Criar nova tarefa"
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Nova Tarefa</Text>
      </TouchableOpacity>

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId}
        onCreateTask={createTask}
        testID="create-task-modal"
      />

      {/* Task Detail / Quick Edit Modal */}
      <TaskDetailModal
        task={selectedTask}
        visible={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        projects={projects}
        availableTasks={tasks}
        onUpdateStatus={handleUpdateStatus}
        onUpdateProgress={handleUpdateProgress}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={deleteTask}
        onTransferTask={transferTask}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onCapturePhoto={handleCapturePhoto}
        onPickPhoto={handlePickPhoto}
        onDeleteAttachment={handleDeleteAttachment}
        testID="task-detail-modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerAvatar: {
    marginLeft: 2,
    marginRight: 2,
  },
  syncIconButton: {
    position: 'relative',
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncIconText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  syncBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[600],
    borderWidth: 1,
    borderColor: colors.neutral.surface,
  },
  syncBadgeDotPending: {
    backgroundColor: '#0284c7',
  },
  syncBadgeDotError: {
    backgroundColor: '#dc2626',
  },
  modulesIconButton: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  modulesIconText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[700],
    fontWeight: typography.fontWeights.bold,
  },
  logoutIconButton: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIconText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  selectorWrapper: {
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    paddingVertical: 4,
  },
  listWrapper: {
    flex: 1,
  },
  fabButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing.lg,
    height: minTouchTarget + 6,
    borderRadius: radii.full,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: spacing.xs,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 22,
  },
  fabText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
});
