import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '../src/services/firebase';
import { generateSlug, getUniqueSlug } from '../src/utils/slugify';

/**
 * Database migration script for CollabCanvas v1.0
 * 
 * Adds slug support to existing projects:
 * - Generates slugs from project names
 * - Ensures slug uniqueness
 * - Adds required new fields (slugHistory, deletedAt)
 * - Preserves all existing data
 * 
 * Run this script ONCE before deploying v1.0
 */

interface LegacyProject {
  id: string;
  name: string;
  ownerId: string;
  collaborators?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Missing fields that we'll add:
  // slug, slugHistory, deletedAt
}

interface MigrationStats {
  totalProjects: number;
  migratedProjects: number;
  errors: string[];
  slugConflicts: number;
}

/**
 * Main migration function
 */
export async function migrateProjectsToV1(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProjects: 0,
    migratedProjects: 0,
    errors: [],
    slugConflicts: 0
  };

  try {
    console.log('🚀 Starting CollabCanvas v1.0 migration...');
    
    // Get all existing projects
    const projectsRef = collection(firestore, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    stats.totalProjects = snapshot.size;
    console.log(`📊 Found ${stats.totalProjects} projects to migrate`);
    
    if (stats.totalProjects === 0) {
      console.log('✅ No projects to migrate');
      return stats;
    }
    
    // Collect all projects and generate slugs
    const projects: LegacyProject[] = [];
    const slugMap = new Map<string, string>(); // slug -> projectId
    const generatedSlugs: string[] = [];
    
    // First pass: collect all projects and check for existing slugs
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data() as any;
      const project: LegacyProject = {
        id: docSnapshot.id,
        name: data.name || 'Untitled Project',
        ownerId: data.ownerId,
        collaborators: data.collaborators || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      projects.push(project);
      
      // Check if project already has a slug (partial migration)
      if (data.slug) {
        generatedSlugs.push(data.slug);
        slugMap.set(data.slug, project.id);
      }
    });
    
    // Second pass: generate unique slugs for projects without them
    for (const project of projects) {
      const existingData = snapshot.docs.find(d => d.id === project.id)?.data();
      
      if (!existingData?.slug) {
        const baseSlug = generateSlug(project.name);
        const uniqueSlug = getUniqueSlug(baseSlug, generatedSlugs);
        
        if (generatedSlugs.includes(uniqueSlug)) {
          stats.slugConflicts++;
          console.warn(`⚠️  Slug conflict for project "${project.name}": ${uniqueSlug}`);
        }
        
        generatedSlugs.push(uniqueSlug);
        slugMap.set(uniqueSlug, project.id);
      }
    }
    
    // Third pass: batch update all projects
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit
    
    for (const project of projects) {
      const existingData = snapshot.docs.find(d => d.id === project.id)?.data();
      
      // Skip if already migrated
      if (existingData?.slug && existingData?.slugHistory !== undefined && existingData?.deletedAt !== undefined) {
        console.log(`⏭️  Skipping already migrated project: ${project.name}`);
        stats.migratedProjects++;
        continue;
      }
      
      const projectRef = doc(firestore, 'projects', project.id);
      const slug = Array.from(slugMap.entries()).find(([_, id]) => id === project.id)?.[0];
      
      if (!slug) {
        stats.errors.push(`Failed to generate slug for project: ${project.name}`);
        continue;
      }
      
      // Add new fields while preserving existing data
      batch.update(projectRef, {
        slug: slug,
        slugHistory: existingData?.slugHistory || [],
        deletedAt: existingData?.deletedAt || null,
        // Update timestamp to mark migration
        updatedAt: Timestamp.now()
      });
      
      batchCount++;
      stats.migratedProjects++;
      
      // Commit batch if we hit the limit
      if (batchCount >= maxBatchSize) {
        console.log(`💾 Committing batch of ${batchCount} projects...`);
        await batch.commit();
        batchCount = 0;
      }
    }
    
    // Commit remaining projects
    if (batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} projects...`);
      await batch.commit();
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors.push(`Migration failed: ${error}`);
  }
  
  return stats;
}

/**
 * Dry run migration to preview changes without modifying data
 */
export async function dryRunMigration(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProjects: 0,
    migratedProjects: 0,
    errors: [],
    slugConflicts: 0
  };

  try {
    console.log('🔍 Running migration dry run...');
    
    const projectsRef = collection(firestore, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    stats.totalProjects = snapshot.size;
    console.log(`📊 Found ${stats.totalProjects} projects`);
    
    const generatedSlugs: string[] = [];
    
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const projectName = data.name || 'Untitled Project';
      
      if (data.slug) {
        console.log(`✅ Project "${projectName}" already has slug: ${data.slug}`);
        generatedSlugs.push(data.slug);
      } else {
        const baseSlug = generateSlug(projectName);
        const uniqueSlug = getUniqueSlug(baseSlug, generatedSlugs);
        
        console.log(`🏷️  Project "${projectName}" would get slug: ${uniqueSlug}`);
        
        if (baseSlug !== uniqueSlug) {
          stats.slugConflicts++;
          console.warn(`⚠️  Slug conflict resolved: ${baseSlug} → ${uniqueSlug}`);
        }
        
        generatedSlugs.push(uniqueSlug);
        stats.migratedProjects++;
      }
    });
    
    console.log('✅ Dry run completed');
    
  } catch (error) {
    console.error('❌ Dry run failed:', error);
    stats.errors.push(`Dry run failed: ${error}`);
  }
  
  return stats;
}

/**
 * Print migration statistics
 */
export function printMigrationStats(stats: MigrationStats): void {
  console.log('\n📈 Migration Statistics:');
  console.log(`   Total projects: ${stats.totalProjects}`);
  console.log(`   Migrated: ${stats.migratedProjects}`);
  console.log(`   Slug conflicts resolved: ${stats.slugConflicts}`);
  console.log(`   Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('');
}

// CLI interface for running migration
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  const runMigration = async () => {
    const stats = isDryRun ? await dryRunMigration() : await migrateProjectsToV1();
    printMigrationStats(stats);
    
    if (stats.errors.length > 0) {
      process.exit(1);
    }
  };
  
  runMigration().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}
