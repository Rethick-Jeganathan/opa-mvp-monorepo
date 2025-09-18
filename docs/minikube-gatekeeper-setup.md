# Minikube + Gatekeeper Setup (Week 1)

This guide installs Minikube locally and deploys Gatekeeper. Use for MVP development.

## Prerequisites
- Docker Desktop (or another supported driver)
- kubectl
- Minikube

## Steps
1. Start Minikube (Docker driver):
   ```bash
   minikube start --driver=docker
   ```
2. Verify:
   ```bash
   kubectl get nodes
   ```
3. Install Gatekeeper (all-in-one):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
   ```
   Wait for pods:
   ```bash
   kubectl -n gatekeeper-system get pods
   ```
4. Apply ConstraintTemplates and Constraints from this repo:
   ```bash
   kubectl apply -f policy/gatekeeper/constrainttemplates/
   kubectl apply -f policy/gatekeeper/constraints/
   ```
5. Test with a sample Deployment using `:latest` or missing labels and ensure denial.

> Note: For production-like installs, pin Gatekeeper versions and use Helm. This guide uses latest for speed.
