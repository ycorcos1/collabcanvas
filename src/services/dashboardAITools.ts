/**
 * Dashboard AI Tools
 *
 * AI-callable functions for dashboard-level actions
 * These tools operate on projects, navigation, and settings
 */

import type { DashboardAIContext } from "./dashboardAIAgent";

/**
 * Dashboard AI Tool Result
 */
export interface DashboardAIToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Dashboard AI Tool Definition
 */
export interface DashboardAITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (
    args: Record<string, any>,
    context: DashboardAIContext
  ) => Promise<DashboardAIToolResult>;
}

/**
 * Tool: Create Project
 */
const createProjectTool: DashboardAITool = {
  name: "create_project",
  description:
    "Create a new project with a specified name and optionally open it immediately",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description:
          "Name of the new project (e.g., 'Homepage Design', 'Mobile App Wireframe')",
      },
      openAfterCreate: {
        type: "boolean",
        description:
          "Whether to navigate to the project after creation (default: false)",
        default: false,
      },
      description: {
        type: "string",
        description: "Optional description for the project",
      },
    },
    required: ["name"],
  },
  execute: async (args, context) => {
    try {
      const projectData = {
        name: args.name,
        description: args.description || "",
        isPublic: false,
      };

      console.log("Dashboard AI: Creating project with data:", projectData);
      const project = await context.dashboardActions.createProject(projectData);
      console.log("Dashboard AI: Project created:", project);

      if (!project) {
        console.error("Dashboard AI: Project creation returned null");
        return {
          success: false,
          message: `Failed to create project "${args.name}"`,
          error: "Project creation returned null",
        };
      }

      // Navigate to project ONLY if explicitly requested
      if (args.openAfterCreate === true) {
        // Use the project's slug or ID for navigation
        const projectPath = `/canvas/${project.slug || project.id}`;
        context.navigate(projectPath);

        return {
          success: true,
          message: `Created and opened project "${args.name}"`,
          data: { projectId: project.id, projectSlug: project.slug },
        };
      }

      // Default: Don't navigate, just confirm creation
      // Return success immediately - let user see the message
      // Then refresh after a longer delay to ensure Firestore propagation
      return {
        success: true,
        message: `✅ Created project "${args.name}"! Refreshing...`,
        data: {
          projectId: project.id,
          projectSlug: project.slug,
          _triggerRefresh: true, // Signal to trigger refresh
        },
      };
    } catch (error: any) {
      console.error("Dashboard AI: Error creating project:", error);
      return {
        success: false,
        message: `Failed to create project: ${error.message}`,
        error: error.message,
      };
    }
  },
};

/**
 * Tool: Navigate To Section
 */
const navigateToSectionTool: DashboardAITool = {
  name: "navigate_to_section",
  description:
    "Navigate to a specific dashboard section (recent, shared, all, trash, settings)",
  parameters: {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["recent", "shared", "all", "trash", "settings"],
        description: "The dashboard section to navigate to",
      },
    },
    required: ["section"],
  },
  execute: async (args, context) => {
    const sectionMap: Record<string, string> = {
      recent: "/dashboard/recent",
      shared: "/dashboard/shared",
      all: "/dashboard/all",
      trash: "/dashboard/trash",
      settings: "/dashboard/settings",
    };

    const path = sectionMap[args.section];

    if (!path) {
      return {
        success: false,
        message: `Unknown section: ${args.section}`,
        error: "Invalid section name",
      };
    }

    try {
      context.navigate(path);

      const sectionNames: Record<string, string> = {
        recent: "Recent Projects",
        shared: "Shared Projects",
        all: "All Projects",
        trash: "Trash",
        settings: "Settings",
      };

      return {
        success: true,
        message: `Navigated to ${sectionNames[args.section]}`,
      };
    } catch (error: any) {
      // Fallback if navigate fails
      return {
        success: false,
        message: `Failed to navigate to ${args.section}: ${error.message}`,
        error: error.message,
      };
    }
  },
};

/**
 * Tool: Search Projects
 */
const searchProjectsTool: DashboardAITool = {
  name: "search_projects",
  description:
    "Search for projects by name or description. Returns information about matching projects.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (project name or keyword)",
      },
    },
    required: ["query"],
  },
  execute: async (_args, _context) => {
    // Note: This is a placeholder - actual search would query Firestore
    // For now, we'll guide the user to use the search in the All Projects section
    return {
      success: true,
      message: `To search for projects, please use the search bar in the "All Projects" section. You can navigate there by saying "go to all projects".`,
    };
  },
};

/**
 * Tool: Delete Project
 */
const deleteProjectTool: DashboardAITool = {
  name: "delete_project",
  description:
    "Delete a project by name. This moves the project to trash (soft delete). Requires confirmation.",
  parameters: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "Name of the project to delete",
      },
      confirm: {
        type: "boolean",
        description: "Confirmation from user (default: false)",
        default: false,
      },
    },
    required: ["projectName"],
  },
  execute: async (args, context) => {
    try {
      // Step 1: If not confirmed, ask for confirmation
      if (!args.confirm) {
        return {
          success: false,
          message: `⚠️ Are you sure you want to delete "${args.projectName}"? This will move it to trash.\n\nSay "Yes, delete ${args.projectName}" to confirm.`,
          error: "Confirmation required",
        };
      }

      // Step 2: Search for project by name
      const projects = await context.dashboardActions.searchProjects(
        args.projectName
      );

      if (!projects || projects.length === 0) {
        return {
          success: false,
          message: `Project "${args.projectName}" not found. Please check the name and try again.`,
          error: "Project not found",
        };
      }

      // If multiple matches, ask user to be more specific
      if (projects.length > 1) {
        const projectList = projects.map((p) => `• ${p.name}`).join("\n");
        return {
          success: false,
          message: `Found ${projects.length} projects matching "${args.projectName}":\n${projectList}\n\nPlease be more specific.`,
          error: "Multiple matches",
        };
      }

      const project = projects[0];

      // Step 3: Check ownership
      if (project.ownerId !== context.user.id) {
        return {
          success: false,
          message: `You don't own "${project.name}". Only the project owner can delete it.`,
          error: "Permission denied",
        };
      }

      // Step 4: Delete (move to trash)
      await context.dashboardActions.deleteProject(project.id);

      // Step 5: Success - trigger refresh
      return {
        success: true,
        message: `✅ Moved "${project.name}" to trash. Refreshing...`,
        data: {
          projectId: project.id,
          _triggerRefresh: true,
        },
      };
    } catch (error: any) {
      console.error("Dashboard AI: Error deleting project:", error);
      return {
        success: false,
        message: `Failed to delete project: ${error.message}`,
        error: error.message,
      };
    }
  },
};

/**
 * Tool: Empty Trash
 */
const emptyTrashTool: DashboardAITool = {
  name: "empty_trash",
  description:
    "Permanently delete ALL projects in trash. This cannot be undone! Requires explicit confirmation.",
  parameters: {
    type: "object",
    properties: {
      confirm: {
        type: "boolean",
        description: "User must explicitly confirm this destructive action",
        default: false,
      },
    },
  },
  execute: async (args, context) => {
    try {
      // Step 1: Require strong confirmation
      if (!args.confirm) {
        return {
          success: false,
          message: `🚨 **WARNING**: This will PERMANENTLY delete ALL projects in your trash!\n\n❌ This action CANNOT be undone.\n\nSay "Yes, empty my trash" to confirm.`,
          error: "Confirmation required",
        };
      }

      // Step 2: Get all trashed projects
      const trashedProjects =
        await context.dashboardActions.getTrashedProjects();

      if (!trashedProjects || trashedProjects.length === 0) {
        return {
          success: true,
          message: "Your trash is already empty. Nothing to delete.",
        };
      }

      const count = trashedProjects.length;
      const projectNames = trashedProjects
        .slice(0, 3)
        .map((p) => p.name)
        .join(", ");
      const moreText = count > 3 ? ` and ${count - 3} more` : "";

      // Step 3: Batch delete permanently
      const projectIds = trashedProjects.map((p) => p.id);
      await context.dashboardActions.batchDeleteProjects(projectIds);

      // Step 4: Success - trigger refresh
      return {
        success: true,
        message: `✅ Permanently deleted ${count} project(s): ${projectNames}${moreText}. Refreshing...`,
        data: {
          count,
          _triggerRefresh: true,
        },
      };
    } catch (error: any) {
      console.error("Dashboard AI: Error emptying trash:", error);
      return {
        success: false,
        message: `Failed to empty trash: ${error.message}`,
        error: error.message,
      };
    }
  },
};

/**
 * Tool: Send Access Invitation
 */
const sendAccessInvitationTool: DashboardAITool = {
  name: "send_access_invitation",
  description:
    "Send a collaboration access invitation to another user by email. Both project name and recipient email are required.",
  parameters: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "Name of the project to share",
      },
      recipientEmail: {
        type: "string",
        description: "Email address of the person to invite",
      },
      message: {
        type: "string",
        description: "Optional personal message to include",
      },
    },
    required: ["projectName", "recipientEmail"],
  },
  execute: async (args, context) => {
    try {
      // Step 1: Search for project
      const projects = await context.dashboardActions.searchProjects(
        args.projectName
      );

      if (!projects || projects.length === 0) {
        return {
          success: false,
          message: `Project "${args.projectName}" not found. Which project would you like to share?`,
          error: "Project not found",
        };
      }

      if (projects.length > 1) {
        const projectList = projects.map((p) => `• ${p.name}`).join("\n");
        return {
          success: false,
          message: `Found multiple projects:\n${projectList}\n\nWhich one do you want to share?`,
          error: "Multiple matches",
        };
      }

      const project = projects[0];

      // Step 2: Check ownership
      if (project.ownerId !== context.user.id) {
        return {
          success: false,
          message: `You don't own "${project.name}". Only the owner can invite collaborators.`,
          error: "Permission denied",
        };
      }

      // Step 3: Send invitation
      await context.dashboardActions.sendCollaborationRequest(
        project.id,
        project.name,
        args.recipientEmail,
        args.message
      );

      return {
        success: true,
        message: `✅ Sent access invitation for "${project.name}" to ${args.recipientEmail}.\n\nThey'll receive a notification and can accept it to start collaborating.`,
        data: {
          projectId: project.id,
          recipientEmail: args.recipientEmail,
        },
      };
    } catch (error: any) {
      console.error("Dashboard AI: Error sending invitation:", error);

      // Handle specific errors
      if (error.message === "already_collaborator") {
        return {
          success: false,
          message: `${args.recipientEmail} is already a collaborator on "${args.projectName}".`,
          error: error.message,
        };
      }

      if (error.message === "already_pending") {
        return {
          success: false,
          message: `There's already a pending invitation for ${args.recipientEmail} on "${args.projectName}".`,
          error: error.message,
        };
      }

      if (error.message === "Invalid email format") {
        return {
          success: false,
          message: `"${args.recipientEmail}" doesn't look like a valid email address. Please check and try again.`,
          error: error.message,
        };
      }

      return {
        success: false,
        message: `Failed to send invitation: ${error.message}`,
        error: error.message,
      };
    }
  },
};

/**
 * Tool: Get Help
 */
const getHelpTool: DashboardAITool = {
  name: "get_help",
  description: "Provide help information about available commands and features",
  parameters: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Specific topic to get help about (optional)",
      },
    },
  },
  execute: async (args, _context) => {
    const helpTopics: Record<string, string> = {
      projects: `**Project Commands:**
• "Create a project called [name]" - Create a new project
• "Open my most recent project" - Navigate to your last project
• "Delete project [name]" - Move a project to trash
• "Search for projects with [keyword]" - Find projects`,

      navigation: `**Navigation Commands:**
• "Go to recent" - View recent projects
• "Show me shared projects" - View projects shared with you
• "Go to all projects" - View all your projects
• "Open trash" - View deleted projects
• "Go to settings" - Access application settings`,

      settings: `**Settings:**
• "Change my password" - Update your password
• "Switch to dark mode" - Change theme
• "Update my profile" - Edit profile information`,
    };

    if (args.topic && helpTopics[args.topic.toLowerCase()]) {
      return {
        success: true,
        message: helpTopics[args.topic.toLowerCase()],
      };
    }

    return {
      success: true,
      message: `**I can help you with:**

${helpTopics.projects}

${helpTopics.navigation}

${helpTopics.settings}

**Ask me:**
• "How do I create a project?"
• "Show me navigation options"
• "Help with settings"`,
    };
  },
};

/**
 * Tool: Change Theme
 */
const changeThemeTool: DashboardAITool = {
  name: "change_theme",
  description: "Change the application theme (light, dark, or system)",
  parameters: {
    type: "object",
    properties: {
      theme: {
        type: "string",
        enum: ["light", "dark", "system"],
        description: "Theme to switch to",
      },
    },
    required: ["theme"],
  },
  execute: async (args, _context) => {
    // Apply theme change
    const themes = {
      light: "light",
      dark: "dark",
      system: "system",
    };

    const selectedTheme = themes[args.theme as keyof typeof themes];

    if (selectedTheme) {
      // Store in localStorage
      localStorage.setItem("horizon-theme", selectedTheme);

      // Apply theme
      if (selectedTheme === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        document.documentElement.classList.toggle("dark", systemPrefersDark);
      } else {
        document.documentElement.classList.toggle(
          "dark",
          selectedTheme === "dark"
        );
      }

      return {
        success: true,
        message: `Theme changed to ${selectedTheme} mode`,
      };
    }

    return {
      success: false,
      message: `Unknown theme: ${args.theme}`,
      error: "Invalid theme",
    };
  },
};

/**
 * Get all dashboard tools with context
 */
export const getDashboardTools = (
  _context: DashboardAIContext
): DashboardAITool[] => {
  return [
    createProjectTool,
    navigateToSectionTool,
    searchProjectsTool,
    deleteProjectTool, // Enhanced with actual deletion
    emptyTrashTool, // NEW
    sendAccessInvitationTool, // NEW
    getHelpTool,
    changeThemeTool,
  ];
};
