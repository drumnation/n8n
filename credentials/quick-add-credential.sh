#!/bin/bash

# Quick Credential Adder for n8n
# Makes adding credentials FAST

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
IMPORTS_DIR="$SCRIPT_DIR/imports"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     n8n Quick Credential Adder                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Function to list available templates
list_templates() {
    echo -e "${GREEN}Available credential templates:${NC}"
    echo ""
    local i=1
    for template in "$TEMPLATES_DIR"/*.json; do
        if [ -f "$template" ]; then
            local name=$(basename "$template" .json)
            echo "  $i) $name"
            ((i++))
        fi
    done
    echo ""
}

# Function to create credential from template
create_from_template() {
    local template_file=$1
    local template_name=$(basename "$template_file" .json)

    echo -e "${BLUE}Creating credential from template: ${template_name}${NC}"
    echo ""

    # Read template
    local template_content=$(cat "$template_file")

    # Extract placeholders
    echo "Please provide the following values:"
    echo ""

    # Copy template to temp file
    local temp_file=$(mktemp)
    cp "$template_file" "$temp_file"

    # Find all placeholders (YOUR_*_HERE pattern)
    local placeholders=$(grep -o 'YOUR_[A-Z_]*_HERE\|YOUR_[A-Z_]*' "$template_file" | sort -u)

    for placeholder in $placeholders; do
        # Make placeholder name readable
        local readable_name=$(echo "$placeholder" | sed 's/YOUR_//g' | sed 's/_HERE//g' | sed 's/_/ /g')

        echo -n "  ${readable_name}: "
        read -r value

        # Replace in temp file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|$placeholder|$value|g" "$temp_file"
        else
            sed -i "s|$placeholder|$value|g" "$temp_file"
        fi
    done

    echo ""
    echo -n "  Credential name (or press Enter for default): "
    read -r cred_name

    if [ -n "$cred_name" ]; then
        # Update name in JSON
        local updated=$(jq --arg name "$cred_name" '.name = $name' "$temp_file")
        echo "$updated" > "$temp_file"
    fi

    # Generate UUID for credential
    local uuid=$(uuidgen | tr '[:upper:]' '[:lower:]')

    # Add ID to credential
    local final=$(jq --arg id "$uuid" '. + {id: $id}' "$temp_file")

    # Save to imports directory
    local import_file="$IMPORTS_DIR/${template_name}_${uuid}.json"
    echo "$final" > "$import_file"

    echo ""
    echo -e "${GREEN}✓ Credential created!${NC}"
    echo ""
    echo "To import to n8n, run:"
    echo -e "${YELLOW}./packages/cli/bin/n8n import:credentials --input=\"$import_file\"${NC}"
    echo ""

    # Ask if user wants to import now
    echo -n "Import now? (y/n): "
    read -r import_now

    if [[ "$import_now" == "y" || "$import_now" == "Y" ]]; then
        cd "$(dirname "$SCRIPT_DIR")"
        ./packages/cli/bin/n8n import:credentials --input="$import_file" 2>&1 | grep -v "error TS" || true
        echo ""
        echo -e "${GREEN}✓ Credential imported!${NC}"
    fi

    # Cleanup
    rm "$temp_file"
}

# Main menu
if [ $# -eq 0 ]; then
    list_templates

    echo -n "Select template number: "
    read -r selection

    # Get template file by number
    local i=1
    for template in "$TEMPLATES_DIR"/*.json; do
        if [ -f "$template" ] && [ "$i" -eq "$selection" ]; then
            create_from_template "$template"
            exit 0
        fi
        ((i++))
    done

    echo -e "${YELLOW}Invalid selection${NC}"
    exit 1
else
    # Direct template name provided
    template_file="$TEMPLATES_DIR/$1.json"
    if [ -f "$template_file" ]; then
        create_from_template "$template_file"
    else
        echo -e "${YELLOW}Template not found: $1${NC}"
        list_templates
        exit 1
    fi
fi
