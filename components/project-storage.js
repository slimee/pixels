export default class ProjectStorage {
  projectsKey = 'projects';
  projectKey = (projectName) => `project-${projectName}`
  storage = new Storage();

  listProjects() {
    return this.storage.load(this.projectsKey) || [];
  }

  addProject(projectName, data) {
    const projects = this.listProjects();
    projects.unshift(projectName);
    this.storage.save(this.projectsKey, projects);
    this.storage.save(this.projectKey(), data);
  }

  dropProject(projectName) {
    const projects = this.listProjects();
    const index = projects.indexOf(projectName);
    projects.splice(index, 1);
    this.storage.save('projects', projects);
    this.storage.drop(this.projectKey(projectName));
  }
}